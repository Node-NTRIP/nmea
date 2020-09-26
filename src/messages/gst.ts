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

import {Float, Time} from '../decode-encode';

/**
 * GST - GNSS Pseudorange Error Statistics
 */
@Sentence(NmeaSentenceType.GST)
export class NmeaMessageGst extends NmeaMessage {
    @Time time?: Date;
    @Float rangeRms?: number;
    @Float standardDeviationMajor?: number;
    @Float standardDeviationMinor?: number;
}