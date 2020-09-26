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

import {NmeaSentenceType} from "./mnemonics";
import {NmeaTalker} from "./talkers";

import {Arr, getDecoderEncoder, Str} from './decode-encode';

const nmeaMessageClasses: Map<NmeaSentenceType, new (internalGuard: never) => NmeaMessage> = new Map();
export function Sentence(type: NmeaSentenceType, delimiter: NmeaTransport.SentenceDelimiter = NmeaTransport.SENTENCE_DELIMITER_PARAMETRIC) {
    return function<T extends NmeaMessage>(constructor: new (internalGuard: never) => T): void {
        Object.defineProperty(constructor, 'sentenceType', {
            value: type,
            writable: false
        });
        Object.defineProperty(constructor, 'sentenceDelimiter', {
            value: delimiter,
            writable: false
        });

        if (nmeaMessageClasses.has(type)) throw new Error(`Class for message type ${type} is already registered`);
        nmeaMessageClasses.set(type, constructor);
    }
}

// Advanced types to get all keys in messages that are functions
type TypeKeys<T, U> = {
    [P in keyof T]: U extends T[P] ? P : never;
}[keyof T];
type FunctionKeys<T> = TypeKeys<T, (...args: any[]) => any>;

/**
 * Abstract NMEA message, containing properties common to all NMEA messages
 */
export abstract class NmeaMessage {
    static readonly sentenceType: NmeaSentenceType;
    static readonly sentenceDelimiter: NmeaTransport.SentenceDelimiter;

    // Only modified by NmeaMessageUnknown and NmeaMessageQuery, otherwise always returns the static properties
    get sentenceType(): NmeaSentenceType | string { return (this.constructor as typeof NmeaMessage).sentenceType; }
    get sentenceDelimiter(): NmeaTransport.SentenceDelimiter { return (this.constructor as typeof NmeaMessage).sentenceDelimiter; }

    talker!: NmeaTalker | string;

    // Force users to initialize using NmeaMessage.construct()
    // noinspection JSUnusedLocalSymbols
    constructor(internalGuard: never) {}

    /**
     * Constructs a new NMEA message
     *
     * @param params Required parameters to initialize the message
     */
    static construct<T extends NmeaMessage>(
        this: (new (internalGuard: never) => T),
        params: Omit<T, 'sentenceType' | 'sentenceDelimiter' | FunctionKeys<T>>): T {
        return Object.assign(new this(<never>undefined), params);
    }
}

/**
 * Unknown NMEA message, for all message types for which a parser has not been provided
 */
export class NmeaMessageUnknown extends NmeaMessage {
    get sentenceType(): NmeaSentenceType | string { return this.unknownSentenceType; }
    get sentenceDelimiter(): NmeaTransport.SentenceDelimiter { return this.unknownSentenceDelimiter }

    unknownSentenceType!: NmeaSentenceType | string;
    unknownSentenceDelimiter!: NmeaTransport.SentenceDelimiter;

    @Arr('elements.length', Str) elements?: string[];
}

/**
 * Proprietary NMEA message, sentence type is a manufacturer mnemonic
 */
export class NmeaMessageProprietary extends NmeaMessageUnknown {
    get manufacturerMnemonic(): string { return this.sentenceType; }
}

/**
 * NMEA query message, for talkers to query sentences from other talkers
 */
export class NmeaMessageQuery extends NmeaMessage {
    get sentenceType(): NmeaSentenceType | string {
        return this.queriedTalker + NmeaTransport.QUERY_ADDRESS_CHARACTER;
    }

    queriedTalker!: NmeaTalker | string;
    @Str queriedSentenceType!: NmeaSentenceType | string
}

export namespace NmeaTransport {
    /** Including sentence delimiter and \r\n */
    export const MAX_SENTENCE_SIZE = 82;

    export const SENTENCE_DELIMITER_PARAMETRIC = '$';
    export const SENTENCE_DELIMITER_ENCAPSULATION = '!';
    export const DATA_FIELD_DELIMITER = ',';
    export const CHECKSUM_FIELD_DELIMITER = '*';
    export const CODE_DELIMITER = '^';
    export const TAG_BLOCK_DELIMITER = '\\';

    export const RESERVED_FUTURE_USE_CHARACTERS = ['~', '\x7f'];

    export const SENTENCE_TERMINATION_SEQUENCE = '\r\n';

    export type SentenceDelimiter = typeof SENTENCE_DELIMITER_PARAMETRIC | typeof SENTENCE_DELIMITER_ENCAPSULATION;

    export const RESERVED_CHARACTERS = [
            SENTENCE_DELIMITER_PARAMETRIC,
            SENTENCE_DELIMITER_ENCAPSULATION,
            DATA_FIELD_DELIMITER,
            CHECKSUM_FIELD_DELIMITER,
            CODE_DELIMITER,
            TAG_BLOCK_DELIMITER,
            ...RESERVED_FUTURE_USE_CHARACTERS
    ];

    export const QUERY_ADDRESS_CHARACTER = 'Q';

    export class Exception extends Error {
        constructor(type: string, message: string) {
            super(`NMEA ${type} exception: ${message}`);
        }
    }

    export class DecodeException extends Exception {
        constructor(message: string) {
            super('decode', message);
        }
    }

    export class EncodeException extends Exception {
        constructor(message: string) {
            super('encode', message);
        }
    }

    /**
     * Decodes the provided string to an NMEA message
     *
     * @param sentence Sentence string to decode
     * @returns Decoded NMEA message
     * @throws {DecodeException} If sentence does not contain a valid RTCM message
     */
    export function decode(sentence: string): NmeaMessage {
        const sentenceDelimiter = sentence[0] as NmeaTransport.SentenceDelimiter;
        if (sentenceDelimiter != SENTENCE_DELIMITER_PARAMETRIC && sentenceDelimiter != SENTENCE_DELIMITER_ENCAPSULATION)
            throw new DecodeException(`Invalid delimiter (expected ${SENTENCE_DELIMITER_PARAMETRIC} or ${SENTENCE_DELIMITER_ENCAPSULATION}, got ${sentenceDelimiter})`);

        const checksumIndex = sentence.indexOf(CHECKSUM_FIELD_DELIMITER);
        const content = sentence.substring(1, checksumIndex);

        const checksumReceived = sentence.substr(checksumIndex + 1, 2).toUpperCase();
        const checksumCalculated = checksum(content);
        if (checksumCalculated !== checksumReceived)
            throw new DecodeException(`Checksum does not match (${checksumCalculated} != ${checksumReceived})`);

        const elements = content.split(DATA_FIELD_DELIMITER);
        const address: string = elements[0];
        if (address.length < 4 || address.length > 5)
            throw new DecodeException(`Invalid address field length: ${address}`);
        if (address.split('').some(c => RESERVED_CHARACTERS.includes(c)))
            throw new DecodeException(`Invalid character found in address field: ${address}`);

        try {
            for (let i = 1; i < elements.length; i++) elements[i] = unescape(elements[i]);
        } catch (err) {
            throw new DecodeException(`Invalid field detected: ${err.message}`);
        }

        const talker = address.slice(0, -3) as NmeaTalker;
        const sentenceType = address.slice(-3) as NmeaSentenceType;

        if (address.length == 5 && sentenceDelimiter === SENTENCE_DELIMITER_PARAMETRIC
                && sentenceType.endsWith(QUERY_ADDRESS_CHARACTER)) {
            const queriedTalker = sentenceType.slice(0, 2) as NmeaTalker | string;
            return NmeaMessageQuery.construct({
                talker: talker,
                queriedTalker: queriedTalker,
                queriedSentenceType: elements[0]
            });
        }

        const resultType = nmeaMessageClasses.get(sentenceType);
        if (resultType === undefined || talker === NmeaTalker.PROPRIETARY_CODE) {
            return (talker === NmeaTalker.PROPRIETARY_CODE ?
                    NmeaMessageProprietary : NmeaMessageUnknown).construct({
                talker: talker,
                unknownSentenceType: sentenceType,
                unknownSentenceDelimiter: sentenceDelimiter,
                elements: elements
            });
        }

        const message: NmeaMessage = new resultType(<never>undefined);

        if (message.sentenceDelimiter !== sentenceDelimiter)
            throw new DecodeException(`Invalid sentence delimiter for sentence type ${message.sentenceType}`);

        message.talker = talker;
        const decoder = getDecoderEncoder(message.constructor).decoder;
        try {
            decoder.run(message, elements, 1);
        } catch (err) {
            throw new DecodeException(`Could not run script: ${err.message}}\n${decoder.fullScript}`);
        }
        return message;
    }

    /**
     * Encodes the provided NMEA message to a string
     *
     * @param message Message to encode
     * @returns Encoded NMEA message sentence string
     * @throws {EncodeException} If an error occurs when running the encode script for the message
     */
    export function encode(message: NmeaMessage): string {
        const sentenceDelimiter = message.sentenceDelimiter;
        if (sentenceDelimiter != SENTENCE_DELIMITER_PARAMETRIC && sentenceDelimiter != SENTENCE_DELIMITER_ENCAPSULATION)
            throw new DecodeException(`Invalid delimiter (expected ${SENTENCE_DELIMITER_PARAMETRIC} or ${SENTENCE_DELIMITER_ENCAPSULATION}, got ${sentenceDelimiter})`);

        const address = message.talker + message.sentenceType;
        if (address.length < 4 || address.length > 5)
            throw new EncodeException(`Invalid address field length: ${address}`);
        if (address.split('').some(c => RESERVED_CHARACTERS.includes(c)))
            throw new DecodeException(`Invalid character found in address field: ${address}`);

        const elements: string[] = [address];
        const encoder = getDecoderEncoder(message.constructor).encoder;
        try {
            encoder.run(message, elements, 1);
        } catch (err) {
            throw new EncodeException(`Could not run script: ${err.message}\n${encoder.fullScript}`);
        }

        for (let i = 1; i < elements.length; i++) elements[i] = escape(elements[i]);

        const messageContent = elements.join(DATA_FIELD_DELIMITER);
        const checksumCalculated = checksum(messageContent);

        return message.sentenceDelimiter
                + messageContent
                + CHECKSUM_FIELD_DELIMITER
                + checksumCalculated
                + SENTENCE_TERMINATION_SEQUENCE;
    }

    /**
     * Calculates the NMEA-0183 sentence checksum for this sentence
     *
     * @param sentence Sentence to calculate checksum for
     */
    export function checksum(sentence: string) {
        let checksum = 0;
        for (let i = 0; i < sentence.length; i++) checksum ^= sentence.charCodeAt(i);
        return (checksum & 0xff).toString(16).toUpperCase().padStart(2, '0');
    }

    /**
     * Escapes the contents of the provided field
     *
     * @param field Field to escape contents of
     */
    export function escape(field: string) {
        for (let i = 0; i < field.length; i++) {
            const char = field.charAt(i);
            const charCode = field.charCodeAt(i);
            if (charCode >= 0x20 && charCode <= 0x7f && !RESERVED_CHARACTERS.includes(char)) continue;

            // Replace character with ^XX and jump to next character
            field = field.slice(0, i)
                    + CODE_DELIMITER
                    + charCode.toString(16).toUpperCase().padStart(2, '0')
                    + field.slice(i + 1);
            i += 2;
        }
        return field;
    }

    /**
     * Unescapes the contents of the provided field
     *
     * Ensures that the field only contains valid characters, and unescapes any escape sequences.
     *
     * @param field Field to unescape contents of
     */
    export function unescape(field: string) {
        for (let i = 0; i < field.length; i++) {
            const char = field.charAt(i);
            const charCode = field.charCodeAt(i);
            if (charCode >= 0x20 && charCode <= 0x7f && !RESERVED_CHARACTERS.includes(char)) continue;

            // Ensure that only valid characters are included in the field
            if (char !== CODE_DELIMITER)
                throw new Error(`Illegal character found at index ${i} in: ${field}`);

            // Now character must be code delimiter

            // Ensure that a valid hex sequence follows the code delimiter
            const unescapedCharCodeHex = field.slice(i + 1, i + 3);
            if (!/[0-9A-Fa-f]{2}/.test(unescapedCharCodeHex))
                throw new Error(`Code delimiter found without corresponding hex code at index ${i} in: ${field}`);

            // Replace ^XX with character and skip character in search
            const unescapedCharCode = parseInt(unescapedCharCodeHex, 16);
            field = field.slice(0, i)
                    + String.fromCharCode(unescapedCharCode)
                    + field.slice(i + 3);
        }
        return field;
    }
}

// Import all messages to add to decoder
import './messages/index';