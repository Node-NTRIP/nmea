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

export enum NmeaFixQuality {
    INVALID = 0,
    NORMAL = 1,
    DIFFERENTIAL = 2,
    PPS = 3,
    RTK_INTEGER = 4,
    RTK_FLOAT = 5,
    DEAD_RECKONING = 6,
    MANUAL = 7,
    SIMULATOR = 8
}

export enum NmeaModeIndicator {
    AUTONOMOUS = 'A',
    DIFFERENTIAL = 'D',
    ESTIMATED = 'E',
    RTK_FLOAT = 'F',
    MANUAL = 'M',
    NO_FIX = 'N',
    PRECISE = 'P',
    RTK_FIXED = 'R',
    SIMULATOR = 'S'
}

export enum NmeaDatum {
    WGS84 = 'W84',
    WGS72 = 'W72',
    SGS85 = 'S85',
    PE90 = 'P90',
    USER_DEFINED = '999'
}

export enum NmeaNavSystem {
    GPS = 1,
    GLONASS = 2,
    GALILEO = 3,
    BEIDOU = 4
}

export enum NmeaNavMode {
    UNAVAILABLE = 1,
    FIX_2D = 2,
    FIX_3D = 3
}

export enum NmeaOperationMode {
    MANUAL = 'M',
    AUTOMATIC = 'A'
}

export enum NmeaDataValidity {
    VALID = 'A',
    INVALID = 'V'
}

export enum NmeaNavStatusIndicator {
    SAFE = 'S',
    CAUTION = 'C',
    UNSAFE = 'U',
    UNAVAILABLE = 'V'
}

export enum NmeaResidualsMode {
    PRE = 0,
    POST = 1
}