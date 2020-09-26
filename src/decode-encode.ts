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

import 'reflect-metadata';

class Coder {
    private static readonly definitions: any[] = [];
    static define(definition: any): string {
        return `this.definitions[${Coder.definitions.push(definition) - 1}]`;
    }

    private readonly definitions = Coder.definitions;

    private lines: string[] = [];

    constructor(private readonly parent?: Coder) {}

    code(...code: string[]) {
        this.lines.push(...code);
    }

    set(prop: any, code: string) {
        this.code(`o.${prop} = ${code}`);
    }

    get fullLines(): string[] {
        return [...this.parent?.fullLines ?? [], ...this.lines];
    }

    get fullScript(): string {
        return this.fullLines.join('\n') + '\n';
    }

    compiled?: (o: Object, e: string[], i: number) => [o: Object, i: number];

    /**
     * Runs the generated coder script to de/encode a bit stream to/from the object
     *
     * @param o Object to de/encode
     * @param e Elements array to decode from/encode to
     * @param i Index in elements array at which to begin
     */
    run(o: Object, e: string[], i: number): [o: Object, i: number] {
        if (this.compiled === undefined)
            this.compiled = new Function('o', 'e', 'i', this.lines.join('\n') + 'return [o, i];') as any;
        return this.compiled!(o, e, i);
    }
}

export namespace Helpers {
    export namespace Float {
        export function decode(val: string) {
            const number = parseFloat(val);
            if (isNaN(number)) return undefined;
            return number;
        }

        export function encode(val?: number) {
            return val?.toString() ?? '';
        }
    }

    export namespace Int {
        export function decode(val: string) {
            const number = parseInt(val);
            if (isNaN(number)) return undefined;
            return number;
        }

        export function encode(val?: number, pad: number = 0) {
            if (val === undefined) return '';

            const result = Math.abs(val).toString().padStart(pad, "0");
            return (val < 0 ? '-' : '') + result;
        }
    }

    export namespace Hex {
        export function decode(val: string) {
            const number = parseInt(val, 16);
            if (isNaN(number)) return undefined;
            return number;
        }

        export function encode(val?: number, pad: number = 0) {
            if (val === undefined) return '';

            const result = Math.abs(val).toString(16).toUpperCase().padStart(pad, "0");
            return (val < 0 ? '-' : '') + result;
        }
    }

    export namespace String {
        export function decode(val: string) {
            return val || undefined;
        }

        export function encode(val?: string) {
            return val ?? '';
        }
    }

    export namespace Chars {
        export function decode(val: string) {
            if (val.length === 0) return undefined;
            return val.split('');
        }

        export function encode(val?: string[]) {
            if (val === undefined) return '';
            return val.join('');
        }
    }

    export namespace Direction {
        export function decode(val: string, pos: string, neg: string) {
            return val !== neg ? 1 : -1;
        }

        export function encode(val: number | undefined, pos: string, neg: string) {
            if (val === undefined) return '';

            return val >= 0 ? pos : neg;
        }
    }

    export namespace Time {
        export function decode(val: string) {
            if (val.length === 0) return undefined;

            const date = new Date(0, 0, 0);
            date.setUTCHours(Number(val.substr(0, 2)));
            date.setUTCMinutes(Number(val.substr(2, 2)));
            date.setUTCSeconds(Number(val.substr(4, 2)));
            date.setUTCMilliseconds(parseFloat('0' + val.substr(6)));
            return date;
        }

        export function encode(val?: Date) {
            if (val === undefined) return '';

            return val.getUTCHours().toString().padStart(2, "0")
                    + val.getUTCMinutes().toString().padStart(2, "0")
                    + val.getUTCSeconds().toString().padStart(2, "0")
                    + (val.getUTCMilliseconds() / 1000).toFixed(2).substr(1);
        }
    }

    export namespace ShortDate {
        export function decode(val: string) {
            if (val.length === 0) return undefined;

            const date = new Date();
            date.setUTCDate(Number(val.substr(0, 2)));
            date.setUTCMonth(Number(val.substr(2, 2)));
            const year = Number(val.substr(4));
            date.setUTCFullYear(year > 100 ? year : (year < 70 ? 2000 : 1900) + year);
            date.setUTCHours(0, 0, 0, 0);
            return date;
        }

        export function encode(val?: Date) {
            if (val === undefined) return '';

            return val.getUTCDate().toString().padStart(2, "0")
                    + val.getUTCMonth().toString().padStart(2, "0")
                    + val.getUTCFullYear().toString().substr(2).padStart(2, "0");
        }
    }

    export namespace FullDate {
        export function decode(val: string) {
            if (val.length === 0) return undefined;

            const date = new Date();
            date.setUTCDate(Number(val.substr(0, 2)));
            date.setUTCMonth(Number(val.substr(2, 2)));
            date.setUTCFullYear(Number(val.substr(4)));
            date.setUTCHours(0, 0, 0, 0);
            return date;
        }

        export function encode(val?: Date) {
            if (val === undefined) return '';

            return val.getUTCDate().toString().padStart(2, "0")
                    + val.getUTCMonth().toString().padStart(2, "0")
                    + val.getUTCFullYear().toString();
        }
    }

    export namespace CompleteDateTime {
        export function decode(time: string, day: string, month: string, year: string) {
            if (time.length === 0 || day.length === 0 || month.length === 0 || year.length === 0) return undefined;
            const date = Helpers.Time.decode(time)!;
            date.setUTCDate(parseInt(day));
            date.setUTCMonth(parseInt(month));
            date.setUTCFullYear(parseInt(year));
            return date;
        }

        export function encode(val: Date) {
            if (val === undefined) return ['', '', '', ''];
            return [
                Helpers.Time.encode(val),
                val.getUTCDate().toString().padStart(2, "0"),
                val.getUTCMonth().toString().padStart(2, "0"),
                val.getUTCFullYear().toString()
            ]
        }
    }

    export namespace Latitude {
        export function decode(lat: string) {
            if (lat.length === 0) return undefined;

            const decimal = lat.length - lat.indexOf('.');
            return (parseInt(lat.slice(0, -decimal - 2)) + (parseFloat(lat.slice(-decimal - 2)) / 60));
        }

        export function encode(lat?: number) {
            if (lat === undefined) return '';

            lat = Math.abs(lat);
            const degrees = Math.floor(lat);
            const minutes = (lat - degrees) * 60;

            return degrees.toString().padStart(2, "0") + minutes.toFixed(2).padStart(5, "0");
        }
    }

    export namespace Longitude {
        export function decode(lng: string, ew: string) {
            if (lng.length === 0) return undefined;

            const decimal = lng.length - lng.indexOf('.');
            return (parseInt(lng.slice(0, -decimal - 2)) + (parseFloat(lng.slice(-decimal - 2)) / 60));
        }

        export function encode(lng?: number) {
            if (lng === undefined) return '';

            lng = Math.abs(lng);
            const degrees = Math.floor(lng);
            const minutes = (lng - degrees) * 60;

            return degrees.toString().padStart(3, "0") + minutes.toFixed(2).padStart(5, "0");
        }
    }
}

export class DecoderEncoder {
    readonly encoder: Coder;
    readonly decoder: Coder;

    static readonly helpers = Coder.define(Helpers);

    constructor(private readonly parent?: DecoderEncoder) {
        this.encoder = new Coder(parent?.encoder);
        this.decoder = new Coder(parent?.decoder);
    }

    array(prop: string, count: string | number) {
        let limit = typeof count === 'number' ? count : `o.${count}`;

        this.decoder.set(prop, `[]`);
        this.decoder.code(`for (let j = 0; j < ${limit}; j++)`);

        this.encoder.code(`for (let j = 0; j < ${limit}; j++) if (o.${prop} === undefined) e[i++] = ''; else`);
    }

    object(prop: string, constructor: new() => any): void {
        const ode = getDecoderEncoder(constructor);

        const constructorDef = Coder.define(constructor);
        const odeDef = Coder.define(ode);

        this.decoder.code(`[o.${prop}, i] = ${odeDef}.decoder.run(new ${constructorDef}(), e, i);`);
        this.encoder.code(`[, i] = ${odeDef}.encoder.run(o.${prop}, e, i);`);
    }

    apply(prop: any, helper: string, count = 1, ...args: any[]) {
        const elements = new Array(count).fill('e[i++]').join(',');

        const decodeArgs = [elements, ...args].join(',');
        this.decoder.set(prop, `${DecoderEncoder.helpers}.${helper}.decode(${decodeArgs});`);

        const encodeArgs = [`o.${prop}`, ...args].join(',');
        this.encoder.code(`${count > 1 ? '[' + elements + ']' : elements} = ${DecoderEncoder.helpers}.${helper}.encode(${encodeArgs});`);
    }

    directional(prop: any, helper: string, positive: string, negative: string) {
        this.decoder.code(`{`,
                `\to.${prop} = ${DecoderEncoder.helpers}.${helper}.decode(e[i++]);`,
                `\tif (o.${prop} !== undefined)`,
                    `\t\to.${prop} *= ${DecoderEncoder.helpers}.Direction.decode(e[i++], "${positive}", "${negative}");`,
        `}`);

        this.encoder.code(`{`,
                `e[i++] = ${DecoderEncoder.helpers}.${helper}.encode(o.${prop});`,
                `e[i++] = ${DecoderEncoder.helpers}.Direction.encode(o.${prop}, "${positive}", "${negative}");`,
        `}`)
    }

    unit(prop: any, val: string) {
        this.decoder.code('i++;');

        this.encoder.code(`e[i++] = o.${prop} !== undefined ? '${val}' : '';`);
    }
}

const decoderEncoderKey = Symbol('decoderEncoder');
export function getDecoderEncoder(target: any): DecoderEncoder {
    const c = (target.hasOwnProperty('constructor') ? target.constructor : target) as any;

    if (!Reflect.hasOwnMetadata(decoderEncoderKey, c))
        Reflect.defineMetadata(decoderEncoderKey,
                new DecoderEncoder(Reflect.getMetadata(decoderEncoderKey, c)), c);

    return Reflect.getMetadata(decoderEncoderKey, c) as DecoderEncoder;
}

function propertyDecorator(f: (decoderEncoder: DecoderEncoder, propertyKey: any, read: boolean, write: boolean) => void) {
    return function(target: any, propertyKey: any, descriptor?: PropertyDescriptor): void {
        let read = descriptor === undefined || descriptor.set !== undefined;
        let write = descriptor === undefined || descriptor.get !== undefined;
        f(getDecoderEncoder(target), propertyKey, read, write);
    }
}

function propertyDecoratorApply(helper: string, count?: number, ...args: any[]) {
    return propertyDecorator((de, key) => de.apply(key, helper, count, args));
}

function propertyDecoratorDirectional(helper: string, positive: string, negative: string) {
    return propertyDecorator((de, key) => de.directional(key, helper, positive, negative));
}

export const Int = propertyDecoratorApply('Int');
export const Float = propertyDecoratorApply('Float');
export const Hex = propertyDecoratorApply('Hex');
export const PadInt = (pad: number) => propertyDecoratorApply('Int', 1, pad);
export const PadHex = (pad: number) => propertyDecoratorApply('Hex', 1, pad);
export const Chars = propertyDecoratorApply('Chars');
export const Str = propertyDecoratorApply('String');
export const Obj = (constructor: new () => any) => propertyDecorator((de, key) => de.object(key, constructor));

export function Arr(length: string | number, type: (target: any, propertyKey: any, descriptor?: PropertyDescriptor) => void) {
    return function(target: any, propertyKey: any): void {
        getDecoderEncoder(target).array(propertyKey, length);
        type(target, propertyKey + '[j]');
    }
}

export const Mag = propertyDecoratorDirectional('Float', 'W', 'E');
export const Lat = propertyDecoratorDirectional('Latitude', 'N', 'S');
export const Lng = propertyDecoratorDirectional('Longitude', 'E', 'W');
export const Time = propertyDecoratorApply('Time');
export const ShortDate = propertyDecoratorApply('ShortDate');
export const FullDate = propertyDecoratorApply('FullDate');
export const CompleteDateTime = propertyDecoratorApply('CompleteDateTime', 4);
export const Unit = (unit: string) => propertyDecorator((de, key) => de.unit(key, unit));