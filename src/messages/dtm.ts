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

import {Sentence, NmeaMessage} from '../nmea';
import {NmeaDatum} from '../enums';
import {NmeaSentenceType} from '../mnemonics';

import {Float, Lat, Lng, Str} from '../decode-encode';

/**
 * DTM - Datum Reference
 */
@Sentence(NmeaSentenceType.DTM)
export class NmeaMessageDtm extends NmeaMessage {
    @Str datum?: NmeaDatum | string;
    @Str subDatum?: string;
    @Lat latitudeOffset?: number;
    @Lng longitudeOffset?: number;
    @Float altitudeOffset?: number;
    @Str refDatum?: NmeaDatum | string;
}