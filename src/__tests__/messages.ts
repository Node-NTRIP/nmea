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

import {NmeaMessage, NmeaTransport} from '../nmea';
import {NmeaSentenceType} from '../mnemonics';
import {NmeaTalker} from '../talkers';
import {
    NmeaMessageDtm,
    NmeaMessageGbs,
    NmeaMessageGga,
    NmeaMessageGll,
    NmeaMessageGns,
    NmeaMessageGrs,
    NmeaMessageGsa,
    NmeaMessageGst,
    NmeaMessageGsv,
    NmeaMessageRmc,
    NmeaMessageThs,
    NmeaMessageTxt,
    NmeaMessageVhw, NmeaMessageVlw, NmeaMessageVpw, NmeaMessageVtg, NmeaMessageZda
} from '../messages';
import {
    NmeaDataValidity,
    NmeaDatum,
    NmeaFixQuality,
    NmeaModeIndicator, NmeaNavMode,
    NmeaNavStatusIndicator,
    NmeaNavSystem, NmeaOperationMode, NmeaResidualsMode
} from '../enums';

const messages: [string, NmeaSentenceType, [number, NmeaMessage, string][]][] = [];
function registerMessage(messageClass: typeof NmeaMessage, messageType: NmeaSentenceType, sampleMessages: [NmeaMessage, string][]): void {
    messages.push([messageClass.name, messageType,
        sampleMessages.map((value, i) =>
                [i + 1, ...value] as [number, NmeaMessage, string])]);
}

/**
 * DTM
 */
registerMessage(
        NmeaMessageDtm,
        NmeaSentenceType.DTM,
        [
            [NmeaMessageDtm.construct({
                talker: NmeaTalker.NAV_SYSTEM_GNSS
            }), '$GNDTM,,,,,,,,*54\r\n'],
            [NmeaMessageDtm.construct({
                talker: NmeaTalker.NAV_SYSTEM_GNSS,
                datum: NmeaDatum.USER_DEFINED,
                subDatum: '1',
                latitudeOffset: 66.66,
                longitudeOffset: 33.33,
                altitudeOffset: 180.00,
                refDatum: NmeaDatum.WGS84
            }), '$GNDTM,999,1,6639.60,N,03319.80,E,180,W84*09\r\n']
        ]
);

/**
 * GBS
 */
registerMessage(
        NmeaMessageGbs,
        NmeaSentenceType.GBS,
        [
            [NmeaMessageGbs.construct({
                talker: NmeaTalker.NAV_SYSTEM_GNSS
            }), '$GNGBS,,,,,,,,,,*5F\r\n'],
            [NmeaMessageGbs.construct({
                talker: NmeaTalker.NAV_SYSTEM_GNSS,
                time: new Date(0, 0, 0, 1, 2, 3, 0),
                latitudeError: 6.66,
                longitudeError: 3.33,
                altitudeError: 1.80,
                satelliteId: 4,
                probability: 0.95,
                bias: 2.38,
                standardDeviation: 0.45,
                systemId: NmeaNavSystem.GPS,
                signalId: 5,
            }), '$GNGBS,012724.00,6.66,3.33,1.8,04,0.95,2.38,0.45,1,5*4B\r\n']
        ]
);

/**
 * GGA
 */
registerMessage(
        NmeaMessageGga,
        NmeaSentenceType.GGA,
        [
            [NmeaMessageGga.construct({
                talker: NmeaTalker.NAV_SYSTEM_GNSS
            }), '$GNGGA,,,,,,,,,,,,,,*48\r\n'],
            [NmeaMessageGga.construct({
                talker: NmeaTalker.NAV_SYSTEM_GNSS,
                time: new Date(0, 0, 0, 1, 2, 3, 0),
                latitude: 66.66,
                longitude: 33.33,
                quality: NmeaFixQuality.SIMULATOR,
                numberSatellites: 10,
                hdop: 2.5,
                altitude: 180.00,
                geoidalSeparation: 90.00,
                differentialAge: 5,
                differentialStationId: 'differentialStationId',
            }), '$GNGGA,012724.00,6639.60,N,03319.80,E,8,10,2.5,180,M,90,M,5,differentialStationId*30\r\n']
        ]
);

/**
 * GLL
 */
registerMessage(
        NmeaMessageGll,
        NmeaSentenceType.GLL,
        [
            [NmeaMessageGll.construct({
                talker: NmeaTalker.NAV_SYSTEM_GNSS
            }), '$GNGLL,,,,,,,*62\r\n'],
            [NmeaMessageGll.construct({
                talker: NmeaTalker.NAV_SYSTEM_GNSS,
                latitude: 66.66,
                longitude: 33.33,
                time: new Date(0, 0, 0, 1, 2, 3, 0),
                status: NmeaDataValidity.VALID,
                modeIndicator: NmeaModeIndicator.SIMULATOR
            }), '$GNGLL,6639.60,N,03319.80,E,012724.00,A,S*6B\r\n']
        ]
);

/**
 * GNS
 */
registerMessage(
        NmeaMessageGns,
        NmeaSentenceType.GNS,
        [
            [NmeaMessageGns.construct({
                talker: NmeaTalker.NAV_SYSTEM_GNSS
            }), '$GNGNS,,,,,,,,,,,,,*7F\r\n'],
            [NmeaMessageGns.construct({
                talker: NmeaTalker.NAV_SYSTEM_GNSS,
                time: new Date(0, 0, 0, 1, 2, 3, 0),
                latitude: 66.66,
                longitude: 33.33,
                modeIndicators: [NmeaModeIndicator.SIMULATOR, NmeaModeIndicator.SIMULATOR, NmeaModeIndicator.SIMULATOR, NmeaModeIndicator.SIMULATOR],
                numberSatellites: 10,
                hdop: 2.5,
                altitude: 180.00,
                geoidalSeparation: 90.00,
                differentialAge: 5,
                differentialStationId: 'differentialStationId',
                navigationStatus: NmeaNavStatusIndicator.SAFE
            }), '$GNGNS,012724.00,6639.60,N,03319.80,E,SSSS,10,2.5,180,90,5,differentialStationId,S*6C\r\n']
        ]
);

/**
 * GRS
 */
registerMessage(
        NmeaMessageGrs,
        NmeaSentenceType.GRS,
        [
            [NmeaMessageGrs.construct({
                talker: NmeaTalker.NAV_SYSTEM_GNSS,
                residuals: new Array(12).fill(undefined)
            }), '$GNGRS,,,,,,,,,,,,,,,,*4F\r\n'],
            [NmeaMessageGrs.construct({
                talker: NmeaTalker.NAV_SYSTEM_GNSS,
                residualsMode: NmeaResidualsMode.POST,
                residuals: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.10, 0.11, 0.12],
                systemId: NmeaNavSystem.GPS,
                signalId: 5
            }), '$GNGRS,,1,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,0.1,0.11,0.12,1,5*79\r\n']
        ]
);

/**
 * GSA
 */
registerMessage(
        NmeaMessageGsa,
        NmeaSentenceType.GSA,
        [
            [NmeaMessageGsa.construct({
                talker: NmeaTalker.NAV_SYSTEM_GNSS,
                satellites: new Array(12).fill(undefined)
            }), '$GNGSA,,,,,,,,,,,,,,,,,,*5C\r\n'],
            [NmeaMessageGsa.construct({
                talker: NmeaTalker.NAV_SYSTEM_GNSS,
                operationMode: NmeaOperationMode.AUTOMATIC,
                navMode: NmeaNavMode.FIX_3D,
                satellites: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                pdop: 0.5,
                hdop: 0.8,
                vdop: 1.1,
                systemId: NmeaNavSystem.GPS
            }), '$GNGSA,A,3,01,02,03,04,05,06,07,08,09,10,11,12,0.5,0.8,1.1,1*3F\r\n']
        ]
);

/**
 * GST
 */
registerMessage(
        NmeaMessageGst,
        NmeaSentenceType.GST,
        [
            [NmeaMessageGst.construct({
                talker: NmeaTalker.NAV_SYSTEM_GNSS
            }), '$GNGST,,,,*49\r\n'],
            [NmeaMessageGst.construct({
                talker: NmeaTalker.NAV_SYSTEM_GNSS,
                time: new Date(0, 0, 0, 1, 2, 3, 0),
                rangeRms: 123.45,
                standardDeviationMajor: 67.89,
                standardDeviationMinor: 98.76
            }), '$GNGST,012724.00,123.45,67.89,98.76*7A\r\n']
        ]
);

/**
 * GSV
 */
registerMessage(
        NmeaMessageGsv,
        NmeaSentenceType.GSV,
        [
            [NmeaMessageGsv.construct({
                talker: NmeaTalker.NAV_SYSTEM_GNSS,
                satellites: []
            }), '$GNGSV,,,,*4B\r\n'],
            [NmeaMessageGsv.construct({
                talker: NmeaTalker.NAV_SYSTEM_GNSS,
                sentenceCount: 1,
                sentenceNumber: 1,
                numberSatellites: 3,
                satellites: [
                    {
                        satelliteId: 1,
                        elevationDegrees: 2,
                        azimuthDegrees: 3,
                        signalNoiseRatio: 4
                    },
                    {
                        satelliteId: 2,
                        elevationDegrees: 4,
                        azimuthDegrees: 6,
                        signalNoiseRatio: 8
                    },
                    {
                        satelliteId: 3,
                        elevationDegrees: 6,
                        azimuthDegrees: 9,
                        signalNoiseRatio: 12
                    }
                ],
                signalId: 3
            }), '$GNGSV,1,1,03,01,02,003,04,02,04,006,08,03,06,009,12,3*48\r\n']
        ]
);

/**
 * RMC
 */
registerMessage(
        NmeaMessageRmc,
        NmeaSentenceType.RMC,
        [
            [NmeaMessageRmc.construct({
                talker: NmeaTalker.NAV_SYSTEM_GNSS
            }), '$GNRMC,,,,,,,,,,,,,*79\r\n'],
            [NmeaMessageRmc.construct({
                talker: NmeaTalker.NAV_SYSTEM_GNSS,
                time: new Date(0, 0, 0, 1, 2, 3, 0),
                status: NmeaDataValidity.VALID,
                latitude: 66.66,
                longitude: 33.33,
                speedOverGroundKnots: 120.00,
                courseOverGroundTrue: 80.00,
                date: new Date(2020, 1, 1, 0, 0, 0, 0),
                magneticVariation: 45.00,
                modeIndicator: NmeaModeIndicator.SIMULATOR,
                navStatus: NmeaNavStatusIndicator.UNAVAILABLE
            }), '$GNRMC,012724.00,A,6639.60,N,03319.80,E,120,80,010120,45,W,S,V*49\r\n']
        ]
);

/**
 * THS
 */
registerMessage(
        NmeaMessageThs,
        NmeaSentenceType.THS,
        [
            [NmeaMessageThs.construct({
                talker: NmeaTalker.NAV_SYSTEM_GNSS
            }), '$GNTHS,,*46\r\n'],
            [NmeaMessageThs.construct({
                talker: NmeaTalker.NAV_SYSTEM_GNSS,
                headingTrue: 45.00,
                modeIndicator: NmeaModeIndicator.SIMULATOR
            }), '$GNTHS,45,S*14\r\n']
        ]
);

/**
 * TXT
 */
registerMessage(
        NmeaMessageTxt,
        NmeaSentenceType.TXT,
        [
            [NmeaMessageTxt.construct({
                talker: NmeaTalker.NAV_SYSTEM_GNSS
            }), '$GNTXT,,,,*51\r\n'],
            [NmeaMessageTxt.construct({
                talker: NmeaTalker.NAV_SYSTEM_GNSS,
                messageCount: 4,
                messageNumber: 1,
                messageType: 99,
                text: 'Test message $^@~*\\'
            }), '$GNTXT,04,01,99,Test message ^24^5E@^7E^2A^5C*16\r\n']
        ]
);

/**
 * VHW
 */
registerMessage(
        NmeaMessageVhw,
        NmeaSentenceType.VHW,
        [
            [NmeaMessageVhw.construct({
                talker: NmeaTalker.NAV_SYSTEM_GNSS
            }), '$GNVHW,,,,,,,,*40\r\n'],
            [NmeaMessageVhw.construct({
                talker: NmeaTalker.NAV_SYSTEM_GNSS,
                headingTrue: 33.33,
                headingMagnetic: 66.66,
                speedKnots: 123,
                speedKmh: 456
            }), '$GNVHW,33.33,T,66.66,M,123,N,456,K*5B\r\n']
        ]
);

/**
 * VLW
 */
registerMessage(
        NmeaMessageVlw,
        NmeaSentenceType.VLW,
        [
            [NmeaMessageVlw.construct({
                talker: NmeaTalker.NAV_SYSTEM_GNSS
            }), '$GNVLW,,,,,,,,*44\r\n'],
            [NmeaMessageVlw.construct({
                talker: NmeaTalker.NAV_SYSTEM_GNSS,
                totalCumulativeWaterDistance: 9999.99,
                resetWaterDistance: 888.88,
                totalCumulativeGroundDistance: 7777.77,
                resetGroundDistance: 666.66,
            }), '$GNVLW,9999.99,N,888.88,N,7777.77,N,666.66,N*4A\r\n']
        ]
);

/**
 * VPW
 */
registerMessage(
        NmeaMessageVpw,
        NmeaSentenceType.VPW,
        [
            [NmeaMessageVpw.construct({
                talker: NmeaTalker.NAV_SYSTEM_GNSS
            }), '$GNVPW,,,,*58\r\n'],
            [NmeaMessageVpw.construct({
                talker: NmeaTalker.NAV_SYSTEM_GNSS,
                speedKnots: 123,
                speedMs: 456
            }), '$GNVPW,123,N,456,M*5C\r\n']
        ]
);

/**
 * VTG
 */
registerMessage(
        NmeaMessageVtg,
        NmeaSentenceType.VTG,
        [
            [NmeaMessageVtg.construct({
                talker: NmeaTalker.NAV_SYSTEM_GNSS
            }), '$GNVTG,,,,,,,,,*60\r\n'],
            [NmeaMessageVtg.construct({
                talker: NmeaTalker.NAV_SYSTEM_GNSS,
                courseOverGroundTrue: 33.33,
                courseOverGroundMagnetic: 66.66,
                speedOverGroundKnots: 123,
                speedOverGroundKmh: 456,
                modeIndicator: NmeaModeIndicator.SIMULATOR
            }), '$GNVTG,33.33,T,66.66,M,123,N,456,K,S*28\r\n']
        ]
);

/**
 * ZDA
 */
registerMessage(
        NmeaMessageZda,
        NmeaSentenceType.ZDA,
        [
            [NmeaMessageZda.construct({
                talker: NmeaTalker.NAV_SYSTEM_GNSS
            }), '$GNZDA,,,,,,*56\r\n'],
            [NmeaMessageZda.construct({
                talker: NmeaTalker.NAV_SYSTEM_GNSS,
                localTimeZoneHours: 18,
                localTimeZoneMinutes: 30
            }), '$GNZDA,,,,,18,30*5C\r\n']
        ]
);

describe.each(messages)('%s (%s)', (messageClassName, sentenceType, sampleMessages) => {
    test('message type', () => {
        expect(sampleMessages[0][1].sentenceType).toBe(sentenceType);
        expect((sampleMessages[0][1].constructor as typeof NmeaMessage).sentenceType).toBe(sentenceType);
    });

    describe.each(sampleMessages)('sample #%d', (i, sampleMessage, sampleOutput) => {
        test('encode', () => expect(NmeaTransport.encode(sampleMessage)).toBe(sampleOutput));
        test('decode', () => expect(NmeaTransport.decode(sampleOutput)).toEqual(sampleMessage));
    });
});