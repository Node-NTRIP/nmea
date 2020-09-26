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

import {NmeaMessage, Sentence} from '../nmea';
import {NmeaSentenceType} from '../mnemonics';

import {Arr, Int, Obj, PadInt} from '../decode-encode';

export class SatelliteData {
    @PadInt(2) satelliteId?: number;
    @PadInt(2) elevationDegrees?: number;
    @PadInt(3) azimuthDegrees?: number;
    @PadInt(2) signalNoiseRatio?: number;
}

/**
 * GSV - GNSS Satellites in View
 */
@Sentence(NmeaSentenceType.GSV)
export class NmeaMessageGsv extends NmeaMessage {
    @Int sentenceCount?: number;
    @Int sentenceNumber?: number;
    @PadInt(2) numberSatellites?: number;
    @Arr('messageSatelliteCount', Obj(SatelliteData)) satellites?: SatelliteData[];
    @Int signalId?: number;

    private get messageSatelliteCount(): number {
        if (this.sentenceNumber === undefined
            || this.sentenceCount === undefined
            || this.numberSatellites === undefined) return 0;
        if (this.sentenceNumber < this.sentenceCount) return 4;
        return this.numberSatellites % 4;
    }
}