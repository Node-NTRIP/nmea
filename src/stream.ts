/*
 * This file is part of the @gnss/nmea distribution (https://github.com/node-ntrip/nmea).
 * Copyright (c) 2020 Nebojsa Cvetkovic.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import stream = require('stream');
import {NmeaMessage, NmeaTransport} from './nmea';

function indexOfLimited(string: Buffer | string, search: string, fromIndex: number, toIndex: number) {
    const index = string.indexOf(search, fromIndex);
    return (index >= toIndex) ? -1 : index;
}

/**
 * Stream to decode raw bytes to NMEA messages
 */
export class NmeaDecodeTransformStream extends stream.Transform {
    private readonly buffer: Buffer = Buffer.allocUnsafe(NmeaTransport.MAX_SENTENCE_SIZE);

    private index: number = 0;
    private synchronized: boolean = false;
    private potential: boolean = false;

    private readonly closeOnError: boolean = false;

    /**
     * Constructs a new NmeaDecodeTransformStream
     *
     * @param closeOnError Whether to emit an error event and close the stream if an invalid NMEA message is encountered.
     * @param synchronizedInitially Whether to expect stream to begin with a well formed NMEA message
     */
    constructor({ closeOnError = true, synchronizedInitially = false }: { closeOnError?: boolean, synchronizedInitially?: boolean } = {}) {
        super({
            readableObjectMode: true,
            writableObjectMode: false
        });

        this.closeOnError = closeOnError;
        this.synchronized = synchronizedInitially;
    }

    private static nextSentenceDelimiter(buffer: Buffer | string, startIndex: number = 0, endIndex: number = buffer.length): number {
        let parametricDelimiterIndex = indexOfLimited(buffer, NmeaTransport.SENTENCE_DELIMITER_PARAMETRIC, startIndex, endIndex);
        let encapsulationDelimiterIndex = indexOfLimited(buffer, NmeaTransport.SENTENCE_DELIMITER_ENCAPSULATION, startIndex, endIndex);

        if (parametricDelimiterIndex === -1) return encapsulationDelimiterIndex;
        if (encapsulationDelimiterIndex === -1) return parametricDelimiterIndex;
        return Math.min(parametricDelimiterIndex, encapsulationDelimiterIndex);
    }

    _transform(chunk: Buffer | string, encoding: string, callback: (error?: (Error | null), data?: any) => void): void {
        if (typeof chunk === 'string')
            chunk = Buffer.from(chunk as string, encoding as BufferEncoding);

        let chunkOffset = 0;

        // Buffer might not be able to hold entire contents of chunk at once, so consume it until empty
        while (chunk.length - chunkOffset > 0) {
            // Search for sync character to speed up process, unless already found
            if (!this.potential && !this.synchronized) {
                const potential = NmeaDecodeTransformStream.nextSentenceDelimiter(chunk, chunkOffset);

                // No potential message found, throw away this chunk
                if (potential < 0) return callback();

                // Skip forward to potential message start in chunk
                this.potential = true;
                chunkOffset = potential;
            }

            // Shift as many bytes as possible into buffer
            const copyBytes = Math.min(chunk.length - chunkOffset, this.buffer.length - this.index);
            chunk.copy(this.buffer, this.index, chunkOffset, chunkOffset + copyBytes);
            this.index += copyBytes;
            chunkOffset += copyBytes;

            do {
                try {
                    // Early run to throw error if delimiter is not found (can happen following successful message)
                    if (NmeaDecodeTransformStream.nextSentenceDelimiter(this.buffer, 0, 1) !== 0)
                        NmeaTransport.decode(this.buffer.toString('ascii', 0, 1));

                    // If end of message has not been received yet, wait
                    const packetLength = indexOfLimited(this.buffer, NmeaTransport.SENTENCE_TERMINATION_SEQUENCE, 0, this.index);
                    if (packetLength < 0) break;

                    const message = NmeaTransport.decode(this.buffer.toString('ascii', 0, packetLength));

                    // Shift contents after packet to start of buffer, and move tail of buffer back by packet length
                    this.buffer.copyWithin(0, packetLength + NmeaTransport.SENTENCE_TERMINATION_SEQUENCE.length);
                    this.index -= packetLength + NmeaTransport.SENTENCE_TERMINATION_SEQUENCE.length;

                    // At this point don't know if there is a potential message following, but stream is synchronized
                    this.potential = false;
                    this.synchronized = true;

                    this.push(message);

                    // Nothing left in buffer, read more from chunk
                    if (this.index === 0) break;
                } catch (err) {
                    if (this.synchronized && this.closeOnError)
                        return callback(err);

                    // No longer synchronized with stream
                    this.synchronized = false;
                    this.potential = false;

                    // Find next sync character
                    const potential = NmeaDecodeTransformStream.nextSentenceDelimiter(this.buffer, 1, this.index);

                    // No potential message found, throw away the buffer contents and read from chunk again
                    if (potential < 0) {
                        this.index = 0;
                        break;
                    }

                    this.potential = true;

                    // Shift new potential portion to start of buffer and try to decode again
                    this.buffer.copyWithin(0, potential);
                    this.index -= potential;
                }
            } while (true);

            // If buffer was full and no message was decoded, discard entire buffer (message is too long)
            if (this.index === this.buffer.length) this.index = 0;
        }

        return callback();
    }
}

/**
 * Stream to encode NMEA messages to raw bytes
 */
export class NmeaEncodeTransformStream extends stream.Transform {
    constructor() {
        super({
            readableObjectMode: false,
            writableObjectMode: true
        });
    }

    _transform(message: NmeaMessage, encoding: string, callback: (error?: (Error | null), data?: any) => void): void {
        try {
            callback(null, NmeaTransport.encode(message));
        } catch (err) {
            callback(err);
        }
    }
}