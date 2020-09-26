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
import {NmeaNavSystem} from '../enums';
import {NmeaSentenceType} from '../mnemonics';

import {Float, Hex, PadInt, Time} from '../decode-encode';

/**
 * GBS - GNSS Satellite Fault Detection
 */
@Sentence(NmeaSentenceType.GBS)
export class NmeaMessageGbs extends NmeaMessage {
    @Time time?: Date;
    @Float latitudeError?: number;
    @Float longitudeError?: number;
    @Float altitudeError?: number;
    @PadInt(2) satelliteId?: number;
    @Float probability?: number;
    @Float bias?: number;
    @Float standardDeviation?: number;
    @Hex systemId?: NmeaNavSystem | number;
    @Hex signalId?: number;
}