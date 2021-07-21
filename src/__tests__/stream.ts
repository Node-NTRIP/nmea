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

import {NmeaDecodeTransformStream, NmeaEncodeTransformStream} from "../stream";
import {NmeaMessage, NmeaMessageUnknown, NmeaTransport} from "../nmea";
import {NmeaTalker} from "../talkers";
import {NmeaMessageGga, NmeaMessageGll, NmeaMessageGns, NmeaMessageGst, NmeaMessageVtg} from "../messages";

describe(NmeaDecodeTransformStream.name, () => {
    test.each([
        ['normal', ['$GNGGA,,,,,,,,,,,,,,*48\r\n', '$GNGLL,,,,,,,*62\r\n', '$GNGNS,,,,,,,,,,,,,*7F\r\n', '$GNGST,,,,*49\r\n', '$GNVTG,,,,,,,,,*60\r\n']],
        ['joined', ['$GNGGA,,,,,,,,,,,,,,*48\r\n$GNGLL,,,,,,,*62\r\n$GNGNS,,,,,,,,,,,,,*7F\r\n$GNGST,,,,*49\r\n$GNVTG,,,,,,,,,*60\r\n']],
        ['long', ['$GNGGA,,,,,,,,,,,,,,*48\r\n$GNGLL,,,,,,,*62\r\n$GNGNS,,,,,,,,,,,,,*7F\r\n$GNGST,,,,*49\r\n', '$GNVTG,,,,,,,,,*60\r\n']],
        ['split #1', ['$GNGGA,,,,,,,,,,,,,,*48\r\n$GNGLL,,,,,,,*62\r\n$GNGNS,,,,,,,,,,,,,*7F\r\n$GNGST,,', ',,*49\r\n', '$GNVTG,,,,,,,,,*60\r\n']],
        ['split #2', ['$GNGGA,,,', ',,,,,,,,,', ',,*48\r\n$GNGLL,,,', ',,,,*62\r', '\n$GNGNS,,,,,,,', ',,,,,,*7F\r', '\n$GNG', 'ST,,', ',,*49\r\n', '$', 'GNVTG,,,,,,,,,*60\r\n']],
        ['split #3', [...'$GNGGA,,,,,,,,,,,,,,*48\r\n$GNGLL,,,,,,,*62\r\n$GNGNS,,,,,,,,,,,,,*7F\r\n$GNGST,,,,*49\r\n$GNVTG,,,,,,,,,*60\r\n'.split('')]],
    ])('decoding sample %s', (name, inputs) => {
        const transform = new NmeaDecodeTransformStream();

        let output: NmeaMessage[] = [];
        transform.on('data', message => output.push(message));

        const promise = new Promise((resolve, reject) => {
            transform.on('end', () => resolve(output));
            transform.on('error', reject);
        })

        inputs.forEach((input) => transform.write(input));
        transform.end();

        return expect(promise).resolves.toEqual([
            NmeaMessageGga.construct({talker: NmeaTalker.NAV_SYSTEM_GNSS}),
            NmeaMessageGll.construct({talker: NmeaTalker.NAV_SYSTEM_GNSS}),
            NmeaMessageGns.construct({talker: NmeaTalker.NAV_SYSTEM_GNSS}),
            NmeaMessageGst.construct({talker: NmeaTalker.NAV_SYSTEM_GNSS}),
            NmeaMessageVtg.construct({talker: NmeaTalker.NAV_SYSTEM_GNSS})
        ]);
    });
});

describe(NmeaEncodeTransformStream.name, () => {
    test('encoding sample', done => {
        const transform = new NmeaEncodeTransformStream();

        let output = '';
        transform.on('data', data => output += data);
        transform.on('end', () => {
            expect(output).toBe('$U1TST,1*2A\r\n$U1TST,2*29\r\n$U1TST,3*28\r\n');
            done();
        });
        transform.on('error', err => done(err));

        const params = {
            talker: 'U1',
            unknownSentenceType: 'TST',
            unknownSentenceDelimiter: '$' as NmeaTransport.SentenceDelimiter
        };

        for (let i = 1; i <= 3; i++) transform.write(NmeaMessageUnknown.construct({
            ...params,
            elements: [i.toString()]
        }));
        transform.end();
    });

    test('error', () => {
        const transform = new NmeaEncodeTransformStream();

        const promise = new Promise((resolve, reject) => {
            transform.once('data', reject);
            transform.once('error', resolve);
        });

        transform.write(NmeaMessageUnknown.construct({
            talker: '',
            unknownSentenceType: '',
            unknownSentenceDelimiter: '' as any,
            elements: ['INVALID', 'MESSAGE']
        }));

        return promise;
    })
});