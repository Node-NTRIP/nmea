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

import {NmeaMessageUnknown, NmeaTransport} from "../nmea";

describe('NmeaTransport', () => {
    test.each([
        NmeaMessageUnknown.construct({
            talker: 'U1',
            unknownSentenceType: 'TST',
            unknownSentenceDelimiter: '%' as any,
            elements: ['INVALID', 'DELIMITER']
        }),
        NmeaMessageUnknown.construct({
            talker: 'U1',
            unknownSentenceType: 'TST',
            unknownSentenceDelimiter: '' as any,
            elements: ['INVALID', 'DELIMITER', 'MISSING']
        }),
        NmeaMessageUnknown.construct({
            talker: '',
            unknownSentenceType: '',
            unknownSentenceDelimiter: '$',
            elements: ['INVALID', 'ADDRESS', 'SHORT']
        }),
        NmeaMessageUnknown.construct({
            talker: 'PP',
            unknownSentenceType: 'NODE',
            unknownSentenceDelimiter: '!',
            elements: ['INVALID', 'ADDRESS', 'LONG']
        }),
        NmeaMessageUnknown.construct({
            talker: 'U1',
            unknownSentenceType: '$TS',
            unknownSentenceDelimiter: '$',
            elements: ['INVALID', 'ADDRESS', 'RESERVED']
        })
    ])('encode(%o) to throw', (message) => {
        expect(() => NmeaTransport.encode(message)).toThrow();
    });

    test.each([
        '',
        '%U1TST,INVALID,DELIMITER*25',
        'U1TST,INVALID,DELIMITER,MISSING*4D',
        '$U1TST,INVALID,CHECKSUM,WRONG*00',
        '$U1TST,INVALID,CHECKSUM,MISSING*',
        '$U1T,INVALID,ADDRESS,SHORT*49',
        '$U1TEST,INVALID,ADDRESS,LONG*53',
        '$U1$TS,INVALID,ADDRESS,RESERVED*68',
        '$U1TST,$,INVALID,FIELD*2c',
        '$U1TST,^0,INVALID,FIELD*66',
        '!U1TXT,01,01,01,INVALID DELIMITER FOR SENTENCE*55'
    ])('decode(%s) to throw', (sentence) => {
        expect(() => NmeaTransport.decode(sentence)).toThrow();
    });

    test.each([
        ['', '00'],
        [' ', '20'],
        ['abcde', '61'],
        ['GPRMC,183729,A,3907.356,N,12102.482,W,000.0,360.0,080301,015.5,E', '6F'],
        ['GPGGA,183730,3907.356,N,12102.482,W,1,05,1.6,646.4,M,-24.1,M,,', '75'],
        ['GPGSA,A,3,02,,,07,,09,24,26,,,,,1.6,1.6,1.0', '3D'],
        ['GPGSV,2,1,08,02,43,088,38,04,42,145,00,05,11,291,00,07,60,043,35', '71'],
        ['GPGSV,2,2,08,08,02,145,00,09,46,303,47,24,16,178,32,26,18,231,43', '77'],
        ['GPGLL,3907.360,N,12102.481,W,183730,A', '33'],
        ['GPRMC,183731,A,3907.482,N,12102.436,W,000.0,360.0,080301,015.5,E', '67'],
    ])('checksum(%s) = %s', (input, checksum) => {
        expect(NmeaTransport.checksum(input)).toBe(checksum);
    });

    test.each([
        ['$', '^24'],
        ['!', '^21'],
        [',', '^2C'],
        ['*', '^2A'],
        ['^', '^5E'],
        ['\\', '^5C'],
        ['~', '^7E'],
        ['\x7f', '^7F'],
        ['\r', '^0D'],
        ['\n', '^0A'],
        ['^^^^', '^5E^5E^5E^5E'],
        [
            ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~',
            ' ^21"#^24%&\'()^2A+^2C-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[^5C]^5E_`abcdefghijklmnopqrstuvwxyz{|}^7E'
        ]
    ])('escape/unescape %s = %s', (unescaped, escaped) => {
        expect(NmeaTransport.escape(unescaped)).toBe(escaped);
        expect(NmeaTransport.unescape(escaped)).toBe(unescaped);
    });

    test.each([
        '$',
        '!',
        ',',
        '*',
        '^',
        '^',
        '\\',
        '~',
        '\x7f',
        '\r',
        '\n',
        '^',
        '^-A',
        '^,',
        '^0G',
        '^GG',
        'abcd^',
        'abcd^0',
    ])('unescape(%s) to throw', (escaped) => {
        expect(() => NmeaTransport.unescape(escaped)).toThrow();
    });
});