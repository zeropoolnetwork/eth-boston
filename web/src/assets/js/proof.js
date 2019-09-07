(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.proof = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var bigInt = (function (undefined) {
    "use strict";

    var BASE = 1e7,
        LOG_BASE = 7,
        MAX_INT = 9007199254740992,
        MAX_INT_ARR = smallToArray(MAX_INT),
        DEFAULT_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

    var supportsNativeBigInt = typeof BigInt === "function";

    function Integer(v, radix, alphabet, caseSensitive) {
        if (typeof v === "undefined") return Integer[0];
        if (typeof radix !== "undefined") return +radix === 10 && !alphabet ? parseValue(v) : parseBase(v, radix, alphabet, caseSensitive);
        return parseValue(v);
    }

    function BigInteger(value, sign) {
        this.value = value;
        this.sign = sign;
        this.isSmall = false;
    }
    BigInteger.prototype = Object.create(Integer.prototype);

    function SmallInteger(value) {
        this.value = value;
        this.sign = value < 0;
        this.isSmall = true;
    }
    SmallInteger.prototype = Object.create(Integer.prototype);

    function NativeBigInt(value) {
        this.value = value;
    }
    NativeBigInt.prototype = Object.create(Integer.prototype);

    function isPrecise(n) {
        return -MAX_INT < n && n < MAX_INT;
    }

    function smallToArray(n) { // For performance reasons doesn't reference BASE, need to change this function if BASE changes
        if (n < 1e7)
            return [n];
        if (n < 1e14)
            return [n % 1e7, Math.floor(n / 1e7)];
        return [n % 1e7, Math.floor(n / 1e7) % 1e7, Math.floor(n / 1e14)];
    }

    function arrayToSmall(arr) { // If BASE changes this function may need to change
        trim(arr);
        var length = arr.length;
        if (length < 4 && compareAbs(arr, MAX_INT_ARR) < 0) {
            switch (length) {
                case 0: return 0;
                case 1: return arr[0];
                case 2: return arr[0] + arr[1] * BASE;
                default: return arr[0] + (arr[1] + arr[2] * BASE) * BASE;
            }
        }
        return arr;
    }

    function trim(v) {
        var i = v.length;
        while (v[--i] === 0);
        v.length = i + 1;
    }

    function createArray(length) { // function shamelessly stolen from Yaffle's library https://github.com/Yaffle/BigInteger
        var x = new Array(length);
        var i = -1;
        while (++i < length) {
            x[i] = 0;
        }
        return x;
    }

    function truncate(n) {
        if (n > 0) return Math.floor(n);
        return Math.ceil(n);
    }

    function add(a, b) { // assumes a and b are arrays with a.length >= b.length
        var l_a = a.length,
            l_b = b.length,
            r = new Array(l_a),
            carry = 0,
            base = BASE,
            sum, i;
        for (i = 0; i < l_b; i++) {
            sum = a[i] + b[i] + carry;
            carry = sum >= base ? 1 : 0;
            r[i] = sum - carry * base;
        }
        while (i < l_a) {
            sum = a[i] + carry;
            carry = sum === base ? 1 : 0;
            r[i++] = sum - carry * base;
        }
        if (carry > 0) r.push(carry);
        return r;
    }

    function addAny(a, b) {
        if (a.length >= b.length) return add(a, b);
        return add(b, a);
    }

    function addSmall(a, carry) { // assumes a is array, carry is number with 0 <= carry < MAX_INT
        var l = a.length,
            r = new Array(l),
            base = BASE,
            sum, i;
        for (i = 0; i < l; i++) {
            sum = a[i] - base + carry;
            carry = Math.floor(sum / base);
            r[i] = sum - carry * base;
            carry += 1;
        }
        while (carry > 0) {
            r[i++] = carry % base;
            carry = Math.floor(carry / base);
        }
        return r;
    }

    BigInteger.prototype.add = function (v) {
        var n = parseValue(v);
        if (this.sign !== n.sign) {
            return this.subtract(n.negate());
        }
        var a = this.value, b = n.value;
        if (n.isSmall) {
            return new BigInteger(addSmall(a, Math.abs(b)), this.sign);
        }
        return new BigInteger(addAny(a, b), this.sign);
    };
    BigInteger.prototype.plus = BigInteger.prototype.add;

    SmallInteger.prototype.add = function (v) {
        var n = parseValue(v);
        var a = this.value;
        if (a < 0 !== n.sign) {
            return this.subtract(n.negate());
        }
        var b = n.value;
        if (n.isSmall) {
            if (isPrecise(a + b)) return new SmallInteger(a + b);
            b = smallToArray(Math.abs(b));
        }
        return new BigInteger(addSmall(b, Math.abs(a)), a < 0);
    };
    SmallInteger.prototype.plus = SmallInteger.prototype.add;

    NativeBigInt.prototype.add = function (v) {
        return new NativeBigInt(this.value + parseValue(v).value);
    }
    NativeBigInt.prototype.plus = NativeBigInt.prototype.add;

    function subtract(a, b) { // assumes a and b are arrays with a >= b
        var a_l = a.length,
            b_l = b.length,
            r = new Array(a_l),
            borrow = 0,
            base = BASE,
            i, difference;
        for (i = 0; i < b_l; i++) {
            difference = a[i] - borrow - b[i];
            if (difference < 0) {
                difference += base;
                borrow = 1;
            } else borrow = 0;
            r[i] = difference;
        }
        for (i = b_l; i < a_l; i++) {
            difference = a[i] - borrow;
            if (difference < 0) difference += base;
            else {
                r[i++] = difference;
                break;
            }
            r[i] = difference;
        }
        for (; i < a_l; i++) {
            r[i] = a[i];
        }
        trim(r);
        return r;
    }

    function subtractAny(a, b, sign) {
        var value;
        if (compareAbs(a, b) >= 0) {
            value = subtract(a, b);
        } else {
            value = subtract(b, a);
            sign = !sign;
        }
        value = arrayToSmall(value);
        if (typeof value === "number") {
            if (sign) value = -value;
            return new SmallInteger(value);
        }
        return new BigInteger(value, sign);
    }

    function subtractSmall(a, b, sign) { // assumes a is array, b is number with 0 <= b < MAX_INT
        var l = a.length,
            r = new Array(l),
            carry = -b,
            base = BASE,
            i, difference;
        for (i = 0; i < l; i++) {
            difference = a[i] + carry;
            carry = Math.floor(difference / base);
            difference %= base;
            r[i] = difference < 0 ? difference + base : difference;
        }
        r = arrayToSmall(r);
        if (typeof r === "number") {
            if (sign) r = -r;
            return new SmallInteger(r);
        } return new BigInteger(r, sign);
    }

    BigInteger.prototype.subtract = function (v) {
        var n = parseValue(v);
        if (this.sign !== n.sign) {
            return this.add(n.negate());
        }
        var a = this.value, b = n.value;
        if (n.isSmall)
            return subtractSmall(a, Math.abs(b), this.sign);
        return subtractAny(a, b, this.sign);
    };
    BigInteger.prototype.minus = BigInteger.prototype.subtract;

    SmallInteger.prototype.subtract = function (v) {
        var n = parseValue(v);
        var a = this.value;
        if (a < 0 !== n.sign) {
            return this.add(n.negate());
        }
        var b = n.value;
        if (n.isSmall) {
            return new SmallInteger(a - b);
        }
        return subtractSmall(b, Math.abs(a), a >= 0);
    };
    SmallInteger.prototype.minus = SmallInteger.prototype.subtract;

    NativeBigInt.prototype.subtract = function (v) {
        return new NativeBigInt(this.value - parseValue(v).value);
    }
    NativeBigInt.prototype.minus = NativeBigInt.prototype.subtract;

    BigInteger.prototype.negate = function () {
        return new BigInteger(this.value, !this.sign);
    };
    SmallInteger.prototype.negate = function () {
        var sign = this.sign;
        var small = new SmallInteger(-this.value);
        small.sign = !sign;
        return small;
    };
    NativeBigInt.prototype.negate = function () {
        return new NativeBigInt(-this.value);
    }

    BigInteger.prototype.abs = function () {
        return new BigInteger(this.value, false);
    };
    SmallInteger.prototype.abs = function () {
        return new SmallInteger(Math.abs(this.value));
    };
    NativeBigInt.prototype.abs = function () {
        return new NativeBigInt(this.value >= 0 ? this.value : -this.value);
    }


    function multiplyLong(a, b) {
        var a_l = a.length,
            b_l = b.length,
            l = a_l + b_l,
            r = createArray(l),
            base = BASE,
            product, carry, i, a_i, b_j;
        for (i = 0; i < a_l; ++i) {
            a_i = a[i];
            for (var j = 0; j < b_l; ++j) {
                b_j = b[j];
                product = a_i * b_j + r[i + j];
                carry = Math.floor(product / base);
                r[i + j] = product - carry * base;
                r[i + j + 1] += carry;
            }
        }
        trim(r);
        return r;
    }

    function multiplySmall(a, b) { // assumes a is array, b is number with |b| < BASE
        var l = a.length,
            r = new Array(l),
            base = BASE,
            carry = 0,
            product, i;
        for (i = 0; i < l; i++) {
            product = a[i] * b + carry;
            carry = Math.floor(product / base);
            r[i] = product - carry * base;
        }
        while (carry > 0) {
            r[i++] = carry % base;
            carry = Math.floor(carry / base);
        }
        return r;
    }

    function shiftLeft(x, n) {
        var r = [];
        while (n-- > 0) r.push(0);
        return r.concat(x);
    }

    function multiplyKaratsuba(x, y) {
        var n = Math.max(x.length, y.length);

        if (n <= 30) return multiplyLong(x, y);
        n = Math.ceil(n / 2);

        var b = x.slice(n),
            a = x.slice(0, n),
            d = y.slice(n),
            c = y.slice(0, n);

        var ac = multiplyKaratsuba(a, c),
            bd = multiplyKaratsuba(b, d),
            abcd = multiplyKaratsuba(addAny(a, b), addAny(c, d));

        var product = addAny(addAny(ac, shiftLeft(subtract(subtract(abcd, ac), bd), n)), shiftLeft(bd, 2 * n));
        trim(product);
        return product;
    }

    // The following function is derived from a surface fit of a graph plotting the performance difference
    // between long multiplication and karatsuba multiplication versus the lengths of the two arrays.
    function useKaratsuba(l1, l2) {
        return -0.012 * l1 - 0.012 * l2 + 0.000015 * l1 * l2 > 0;
    }

    BigInteger.prototype.multiply = function (v) {
        var n = parseValue(v),
            a = this.value, b = n.value,
            sign = this.sign !== n.sign,
            abs;
        if (n.isSmall) {
            if (b === 0) return Integer[0];
            if (b === 1) return this;
            if (b === -1) return this.negate();
            abs = Math.abs(b);
            if (abs < BASE) {
                return new BigInteger(multiplySmall(a, abs), sign);
            }
            b = smallToArray(abs);
        }
        if (useKaratsuba(a.length, b.length)) // Karatsuba is only faster for certain array sizes
            return new BigInteger(multiplyKaratsuba(a, b), sign);
        return new BigInteger(multiplyLong(a, b), sign);
    };

    BigInteger.prototype.times = BigInteger.prototype.multiply;

    function multiplySmallAndArray(a, b, sign) { // a >= 0
        if (a < BASE) {
            return new BigInteger(multiplySmall(b, a), sign);
        }
        return new BigInteger(multiplyLong(b, smallToArray(a)), sign);
    }
    SmallInteger.prototype._multiplyBySmall = function (a) {
        if (isPrecise(a.value * this.value)) {
            return new SmallInteger(a.value * this.value);
        }
        return multiplySmallAndArray(Math.abs(a.value), smallToArray(Math.abs(this.value)), this.sign !== a.sign);
    };
    BigInteger.prototype._multiplyBySmall = function (a) {
        if (a.value === 0) return Integer[0];
        if (a.value === 1) return this;
        if (a.value === -1) return this.negate();
        return multiplySmallAndArray(Math.abs(a.value), this.value, this.sign !== a.sign);
    };
    SmallInteger.prototype.multiply = function (v) {
        return parseValue(v)._multiplyBySmall(this);
    };
    SmallInteger.prototype.times = SmallInteger.prototype.multiply;

    NativeBigInt.prototype.multiply = function (v) {
        return new NativeBigInt(this.value * parseValue(v).value);
    }
    NativeBigInt.prototype.times = NativeBigInt.prototype.multiply;

    function square(a) {
        //console.assert(2 * BASE * BASE < MAX_INT);
        var l = a.length,
            r = createArray(l + l),
            base = BASE,
            product, carry, i, a_i, a_j;
        for (i = 0; i < l; i++) {
            a_i = a[i];
            carry = 0 - a_i * a_i;
            for (var j = i; j < l; j++) {
                a_j = a[j];
                product = 2 * (a_i * a_j) + r[i + j] + carry;
                carry = Math.floor(product / base);
                r[i + j] = product - carry * base;
            }
            r[i + l] = carry;
        }
        trim(r);
        return r;
    }

    BigInteger.prototype.square = function () {
        return new BigInteger(square(this.value), false);
    };

    SmallInteger.prototype.square = function () {
        var value = this.value * this.value;
        if (isPrecise(value)) return new SmallInteger(value);
        return new BigInteger(square(smallToArray(Math.abs(this.value))), false);
    };

    NativeBigInt.prototype.square = function (v) {
        return new NativeBigInt(this.value * this.value);
    }

    function divMod1(a, b) { // Left over from previous version. Performs faster than divMod2 on smaller input sizes.
        var a_l = a.length,
            b_l = b.length,
            base = BASE,
            result = createArray(b.length),
            divisorMostSignificantDigit = b[b_l - 1],
            // normalization
            lambda = Math.ceil(base / (2 * divisorMostSignificantDigit)),
            remainder = multiplySmall(a, lambda),
            divisor = multiplySmall(b, lambda),
            quotientDigit, shift, carry, borrow, i, l, q;
        if (remainder.length <= a_l) remainder.push(0);
        divisor.push(0);
        divisorMostSignificantDigit = divisor[b_l - 1];
        for (shift = a_l - b_l; shift >= 0; shift--) {
            quotientDigit = base - 1;
            if (remainder[shift + b_l] !== divisorMostSignificantDigit) {
                quotientDigit = Math.floor((remainder[shift + b_l] * base + remainder[shift + b_l - 1]) / divisorMostSignificantDigit);
            }
            // quotientDigit <= base - 1
            carry = 0;
            borrow = 0;
            l = divisor.length;
            for (i = 0; i < l; i++) {
                carry += quotientDigit * divisor[i];
                q = Math.floor(carry / base);
                borrow += remainder[shift + i] - (carry - q * base);
                carry = q;
                if (borrow < 0) {
                    remainder[shift + i] = borrow + base;
                    borrow = -1;
                } else {
                    remainder[shift + i] = borrow;
                    borrow = 0;
                }
            }
            while (borrow !== 0) {
                quotientDigit -= 1;
                carry = 0;
                for (i = 0; i < l; i++) {
                    carry += remainder[shift + i] - base + divisor[i];
                    if (carry < 0) {
                        remainder[shift + i] = carry + base;
                        carry = 0;
                    } else {
                        remainder[shift + i] = carry;
                        carry = 1;
                    }
                }
                borrow += carry;
            }
            result[shift] = quotientDigit;
        }
        // denormalization
        remainder = divModSmall(remainder, lambda)[0];
        return [arrayToSmall(result), arrayToSmall(remainder)];
    }

    function divMod2(a, b) { // Implementation idea shamelessly stolen from Silent Matt's library http://silentmatt.com/biginteger/
        // Performs faster than divMod1 on larger input sizes.
        var a_l = a.length,
            b_l = b.length,
            result = [],
            part = [],
            base = BASE,
            guess, xlen, highx, highy, check;
        while (a_l) {
            part.unshift(a[--a_l]);
            trim(part);
            if (compareAbs(part, b) < 0) {
                result.push(0);
                continue;
            }
            xlen = part.length;
            highx = part[xlen - 1] * base + part[xlen - 2];
            highy = b[b_l - 1] * base + b[b_l - 2];
            if (xlen > b_l) {
                highx = (highx + 1) * base;
            }
            guess = Math.ceil(highx / highy);
            do {
                check = multiplySmall(b, guess);
                if (compareAbs(check, part) <= 0) break;
                guess--;
            } while (guess);
            result.push(guess);
            part = subtract(part, check);
        }
        result.reverse();
        return [arrayToSmall(result), arrayToSmall(part)];
    }

    function divModSmall(value, lambda) {
        var length = value.length,
            quotient = createArray(length),
            base = BASE,
            i, q, remainder, divisor;
        remainder = 0;
        for (i = length - 1; i >= 0; --i) {
            divisor = remainder * base + value[i];
            q = truncate(divisor / lambda);
            remainder = divisor - q * lambda;
            quotient[i] = q | 0;
        }
        return [quotient, remainder | 0];
    }

    function divModAny(self, v) {
        var value, n = parseValue(v);
        if (supportsNativeBigInt) {
            return [new NativeBigInt(self.value / n.value), new NativeBigInt(self.value % n.value)];
        }
        var a = self.value, b = n.value;
        var quotient;
        if (b === 0) throw new Error("Cannot divide by zero");
        if (self.isSmall) {
            if (n.isSmall) {
                return [new SmallInteger(truncate(a / b)), new SmallInteger(a % b)];
            }
            return [Integer[0], self];
        }
        if (n.isSmall) {
            if (b === 1) return [self, Integer[0]];
            if (b == -1) return [self.negate(), Integer[0]];
            var abs = Math.abs(b);
            if (abs < BASE) {
                value = divModSmall(a, abs);
                quotient = arrayToSmall(value[0]);
                var remainder = value[1];
                if (self.sign) remainder = -remainder;
                if (typeof quotient === "number") {
                    if (self.sign !== n.sign) quotient = -quotient;
                    return [new SmallInteger(quotient), new SmallInteger(remainder)];
                }
                return [new BigInteger(quotient, self.sign !== n.sign), new SmallInteger(remainder)];
            }
            b = smallToArray(abs);
        }
        var comparison = compareAbs(a, b);
        if (comparison === -1) return [Integer[0], self];
        if (comparison === 0) return [Integer[self.sign === n.sign ? 1 : -1], Integer[0]];

        // divMod1 is faster on smaller input sizes
        if (a.length + b.length <= 200)
            value = divMod1(a, b);
        else value = divMod2(a, b);

        quotient = value[0];
        var qSign = self.sign !== n.sign,
            mod = value[1],
            mSign = self.sign;
        if (typeof quotient === "number") {
            if (qSign) quotient = -quotient;
            quotient = new SmallInteger(quotient);
        } else quotient = new BigInteger(quotient, qSign);
        if (typeof mod === "number") {
            if (mSign) mod = -mod;
            mod = new SmallInteger(mod);
        } else mod = new BigInteger(mod, mSign);
        return [quotient, mod];
    }

    BigInteger.prototype.divmod = function (v) {
        var result = divModAny(this, v);
        return {
            quotient: result[0],
            remainder: result[1]
        };
    };
    NativeBigInt.prototype.divmod = SmallInteger.prototype.divmod = BigInteger.prototype.divmod;


    BigInteger.prototype.divide = function (v) {
        return divModAny(this, v)[0];
    };
    NativeBigInt.prototype.over = NativeBigInt.prototype.divide = function (v) {
        return new NativeBigInt(this.value / parseValue(v).value);
    };
    SmallInteger.prototype.over = SmallInteger.prototype.divide = BigInteger.prototype.over = BigInteger.prototype.divide;

    BigInteger.prototype.mod = function (v) {
        return divModAny(this, v)[1];
    };
    NativeBigInt.prototype.mod = NativeBigInt.prototype.remainder = function (v) {
        return new NativeBigInt(this.value % parseValue(v).value);
    };
    SmallInteger.prototype.remainder = SmallInteger.prototype.mod = BigInteger.prototype.remainder = BigInteger.prototype.mod;

    BigInteger.prototype.pow = function (v) {
        var n = parseValue(v),
            a = this.value,
            b = n.value,
            value, x, y;
        if (b === 0) return Integer[1];
        if (a === 0) return Integer[0];
        if (a === 1) return Integer[1];
        if (a === -1) return n.isEven() ? Integer[1] : Integer[-1];
        if (n.sign) {
            return Integer[0];
        }
        if (!n.isSmall) throw new Error("The exponent " + n.toString() + " is too large.");
        if (this.isSmall) {
            if (isPrecise(value = Math.pow(a, b)))
                return new SmallInteger(truncate(value));
        }
        x = this;
        y = Integer[1];
        while (true) {
            if (b & 1 === 1) {
                y = y.times(x);
                --b;
            }
            if (b === 0) break;
            b /= 2;
            x = x.square();
        }
        return y;
    };
    SmallInteger.prototype.pow = BigInteger.prototype.pow;

    NativeBigInt.prototype.pow = function (v) {
        var n = parseValue(v);
        var a = this.value, b = n.value;
        var _0 = BigInt(0), _1 = BigInt(1), _2 = BigInt(2);
        if (b === _0) return Integer[1];
        if (a === _0) return Integer[0];
        if (a === _1) return Integer[1];
        if (a === BigInt(-1)) return n.isEven() ? Integer[1] : Integer[-1];
        if (n.isNegative()) return new NativeBigInt(_0);
        var x = this;
        var y = Integer[1];
        while (true) {
            if ((b & _1) === _1) {
                y = y.times(x);
                --b;
            }
            if (b === _0) break;
            b /= _2;
            x = x.square();
        }
        return y;
    }

    BigInteger.prototype.modPow = function (exp, mod) {
        exp = parseValue(exp);
        mod = parseValue(mod);
        if (mod.isZero()) throw new Error("Cannot take modPow with modulus 0");
        var r = Integer[1],
            base = this.mod(mod);
        if (exp.isNegative()) {
            exp = exp.multiply(Integer[-1]);
            base = base.modInv(mod);
        }
        while (exp.isPositive()) {
            if (base.isZero()) return Integer[0];
            if (exp.isOdd()) r = r.multiply(base).mod(mod);
            exp = exp.divide(2);
            base = base.square().mod(mod);
        }
        return r;
    };
    NativeBigInt.prototype.modPow = SmallInteger.prototype.modPow = BigInteger.prototype.modPow;

    function compareAbs(a, b) {
        if (a.length !== b.length) {
            return a.length > b.length ? 1 : -1;
        }
        for (var i = a.length - 1; i >= 0; i--) {
            if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1;
        }
        return 0;
    }

    BigInteger.prototype.compareAbs = function (v) {
        var n = parseValue(v),
            a = this.value,
            b = n.value;
        if (n.isSmall) return 1;
        return compareAbs(a, b);
    };
    SmallInteger.prototype.compareAbs = function (v) {
        var n = parseValue(v),
            a = Math.abs(this.value),
            b = n.value;
        if (n.isSmall) {
            b = Math.abs(b);
            return a === b ? 0 : a > b ? 1 : -1;
        }
        return -1;
    };
    NativeBigInt.prototype.compareAbs = function (v) {
        var a = this.value;
        var b = parseValue(v).value;
        a = a >= 0 ? a : -a;
        b = b >= 0 ? b : -b;
        return a === b ? 0 : a > b ? 1 : -1;
    }

    BigInteger.prototype.compare = function (v) {
        // See discussion about comparison with Infinity:
        // https://github.com/peterolson/BigInteger.js/issues/61
        if (v === Infinity) {
            return -1;
        }
        if (v === -Infinity) {
            return 1;
        }

        var n = parseValue(v),
            a = this.value,
            b = n.value;
        if (this.sign !== n.sign) {
            return n.sign ? 1 : -1;
        }
        if (n.isSmall) {
            return this.sign ? -1 : 1;
        }
        return compareAbs(a, b) * (this.sign ? -1 : 1);
    };
    BigInteger.prototype.compareTo = BigInteger.prototype.compare;

    SmallInteger.prototype.compare = function (v) {
        if (v === Infinity) {
            return -1;
        }
        if (v === -Infinity) {
            return 1;
        }

        var n = parseValue(v),
            a = this.value,
            b = n.value;
        if (n.isSmall) {
            return a == b ? 0 : a > b ? 1 : -1;
        }
        if (a < 0 !== n.sign) {
            return a < 0 ? -1 : 1;
        }
        return a < 0 ? 1 : -1;
    };
    SmallInteger.prototype.compareTo = SmallInteger.prototype.compare;

    NativeBigInt.prototype.compare = function (v) {
        if (v === Infinity) {
            return -1;
        }
        if (v === -Infinity) {
            return 1;
        }
        var a = this.value;
        var b = parseValue(v).value;
        return a === b ? 0 : a > b ? 1 : -1;
    }
    NativeBigInt.prototype.compareTo = NativeBigInt.prototype.compare;

    BigInteger.prototype.equals = function (v) {
        return this.compare(v) === 0;
    };
    NativeBigInt.prototype.eq = NativeBigInt.prototype.equals = SmallInteger.prototype.eq = SmallInteger.prototype.equals = BigInteger.prototype.eq = BigInteger.prototype.equals;

    BigInteger.prototype.notEquals = function (v) {
        return this.compare(v) !== 0;
    };
    NativeBigInt.prototype.neq = NativeBigInt.prototype.notEquals = SmallInteger.prototype.neq = SmallInteger.prototype.notEquals = BigInteger.prototype.neq = BigInteger.prototype.notEquals;

    BigInteger.prototype.greater = function (v) {
        return this.compare(v) > 0;
    };
    NativeBigInt.prototype.gt = NativeBigInt.prototype.greater = SmallInteger.prototype.gt = SmallInteger.prototype.greater = BigInteger.prototype.gt = BigInteger.prototype.greater;

    BigInteger.prototype.lesser = function (v) {
        return this.compare(v) < 0;
    };
    NativeBigInt.prototype.lt = NativeBigInt.prototype.lesser = SmallInteger.prototype.lt = SmallInteger.prototype.lesser = BigInteger.prototype.lt = BigInteger.prototype.lesser;

    BigInteger.prototype.greaterOrEquals = function (v) {
        return this.compare(v) >= 0;
    };
    NativeBigInt.prototype.geq = NativeBigInt.prototype.greaterOrEquals = SmallInteger.prototype.geq = SmallInteger.prototype.greaterOrEquals = BigInteger.prototype.geq = BigInteger.prototype.greaterOrEquals;

    BigInteger.prototype.lesserOrEquals = function (v) {
        return this.compare(v) <= 0;
    };
    NativeBigInt.prototype.leq = NativeBigInt.prototype.lesserOrEquals = SmallInteger.prototype.leq = SmallInteger.prototype.lesserOrEquals = BigInteger.prototype.leq = BigInteger.prototype.lesserOrEquals;

    BigInteger.prototype.isEven = function () {
        return (this.value[0] & 1) === 0;
    };
    SmallInteger.prototype.isEven = function () {
        return (this.value & 1) === 0;
    };
    NativeBigInt.prototype.isEven = function () {
        return (this.value & BigInt(1)) === BigInt(0);
    }

    BigInteger.prototype.isOdd = function () {
        return (this.value[0] & 1) === 1;
    };
    SmallInteger.prototype.isOdd = function () {
        return (this.value & 1) === 1;
    };
    NativeBigInt.prototype.isOdd = function () {
        return (this.value & BigInt(1)) === BigInt(1);
    }

    BigInteger.prototype.isPositive = function () {
        return !this.sign;
    };
    SmallInteger.prototype.isPositive = function () {
        return this.value > 0;
    };
    NativeBigInt.prototype.isPositive = SmallInteger.prototype.isPositive;

    BigInteger.prototype.isNegative = function () {
        return this.sign;
    };
    SmallInteger.prototype.isNegative = function () {
        return this.value < 0;
    };
    NativeBigInt.prototype.isNegative = SmallInteger.prototype.isNegative;

    BigInteger.prototype.isUnit = function () {
        return false;
    };
    SmallInteger.prototype.isUnit = function () {
        return Math.abs(this.value) === 1;
    };
    NativeBigInt.prototype.isUnit = function () {
        return this.abs().value === BigInt(1);
    }

    BigInteger.prototype.isZero = function () {
        return false;
    };
    SmallInteger.prototype.isZero = function () {
        return this.value === 0;
    };
    NativeBigInt.prototype.isZero = function () {
        return this.value === BigInt(0);
    }

    BigInteger.prototype.isDivisibleBy = function (v) {
        var n = parseValue(v);
        if (n.isZero()) return false;
        if (n.isUnit()) return true;
        if (n.compareAbs(2) === 0) return this.isEven();
        return this.mod(n).isZero();
    };
    NativeBigInt.prototype.isDivisibleBy = SmallInteger.prototype.isDivisibleBy = BigInteger.prototype.isDivisibleBy;

    function isBasicPrime(v) {
        var n = v.abs();
        if (n.isUnit()) return false;
        if (n.equals(2) || n.equals(3) || n.equals(5)) return true;
        if (n.isEven() || n.isDivisibleBy(3) || n.isDivisibleBy(5)) return false;
        if (n.lesser(49)) return true;
        // we don't know if it's prime: let the other functions figure it out
    }

    function millerRabinTest(n, a) {
        var nPrev = n.prev(),
            b = nPrev,
            r = 0,
            d, t, i, x;
        while (b.isEven()) b = b.divide(2), r++;
        next: for (i = 0; i < a.length; i++) {
            if (n.lesser(a[i])) continue;
            x = bigInt(a[i]).modPow(b, n);
            if (x.isUnit() || x.equals(nPrev)) continue;
            for (d = r - 1; d != 0; d--) {
                x = x.square().mod(n);
                if (x.isUnit()) return false;
                if (x.equals(nPrev)) continue next;
            }
            return false;
        }
        return true;
    }

    // Set "strict" to true to force GRH-supported lower bound of 2*log(N)^2
    BigInteger.prototype.isPrime = function (strict) {
        var isPrime = isBasicPrime(this);
        if (isPrime !== undefined) return isPrime;
        var n = this.abs();
        var bits = n.bitLength();
        if (bits <= 64)
            return millerRabinTest(n, [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37]);
        var logN = Math.log(2) * bits.toJSNumber();
        var t = Math.ceil((strict === true) ? (2 * Math.pow(logN, 2)) : logN);
        for (var a = [], i = 0; i < t; i++) {
            a.push(bigInt(i + 2));
        }
        return millerRabinTest(n, a);
    };
    NativeBigInt.prototype.isPrime = SmallInteger.prototype.isPrime = BigInteger.prototype.isPrime;

    BigInteger.prototype.isProbablePrime = function (iterations) {
        var isPrime = isBasicPrime(this);
        if (isPrime !== undefined) return isPrime;
        var n = this.abs();
        var t = iterations === undefined ? 5 : iterations;
        for (var a = [], i = 0; i < t; i++) {
            a.push(bigInt.randBetween(2, n.minus(2)));
        }
        return millerRabinTest(n, a);
    };
    NativeBigInt.prototype.isProbablePrime = SmallInteger.prototype.isProbablePrime = BigInteger.prototype.isProbablePrime;

    BigInteger.prototype.modInv = function (n) {
        var t = bigInt.zero, newT = bigInt.one, r = parseValue(n), newR = this.abs(), q, lastT, lastR;
        while (!newR.isZero()) {
            q = r.divide(newR);
            lastT = t;
            lastR = r;
            t = newT;
            r = newR;
            newT = lastT.subtract(q.multiply(newT));
            newR = lastR.subtract(q.multiply(newR));
        }
        if (!r.isUnit()) throw new Error(this.toString() + " and " + n.toString() + " are not co-prime");
        if (t.compare(0) === -1) {
            t = t.add(n);
        }
        if (this.isNegative()) {
            return t.negate();
        }
        return t;
    };

    NativeBigInt.prototype.modInv = SmallInteger.prototype.modInv = BigInteger.prototype.modInv;

    BigInteger.prototype.next = function () {
        var value = this.value;
        if (this.sign) {
            return subtractSmall(value, 1, this.sign);
        }
        return new BigInteger(addSmall(value, 1), this.sign);
    };
    SmallInteger.prototype.next = function () {
        var value = this.value;
        if (value + 1 < MAX_INT) return new SmallInteger(value + 1);
        return new BigInteger(MAX_INT_ARR, false);
    };
    NativeBigInt.prototype.next = function () {
        return new NativeBigInt(this.value + BigInt(1));
    }

    BigInteger.prototype.prev = function () {
        var value = this.value;
        if (this.sign) {
            return new BigInteger(addSmall(value, 1), true);
        }
        return subtractSmall(value, 1, this.sign);
    };
    SmallInteger.prototype.prev = function () {
        var value = this.value;
        if (value - 1 > -MAX_INT) return new SmallInteger(value - 1);
        return new BigInteger(MAX_INT_ARR, true);
    };
    NativeBigInt.prototype.prev = function () {
        return new NativeBigInt(this.value - BigInt(1));
    }

    var powersOfTwo = [1];
    while (2 * powersOfTwo[powersOfTwo.length - 1] <= BASE) powersOfTwo.push(2 * powersOfTwo[powersOfTwo.length - 1]);
    var powers2Length = powersOfTwo.length, highestPower2 = powersOfTwo[powers2Length - 1];

    function shift_isSmall(n) {
        return Math.abs(n) <= BASE;
    }

    BigInteger.prototype.shiftLeft = function (v) {
        var n = parseValue(v).toJSNumber();
        if (!shift_isSmall(n)) {
            throw new Error(String(n) + " is too large for shifting.");
        }
        if (n < 0) return this.shiftRight(-n);
        var result = this;
        if (result.isZero()) return result;
        while (n >= powers2Length) {
            result = result.multiply(highestPower2);
            n -= powers2Length - 1;
        }
        return result.multiply(powersOfTwo[n]);
    };
    NativeBigInt.prototype.shiftLeft = SmallInteger.prototype.shiftLeft = BigInteger.prototype.shiftLeft;

    BigInteger.prototype.shiftRight = function (v) {
        var remQuo;
        var n = parseValue(v).toJSNumber();
        if (!shift_isSmall(n)) {
            throw new Error(String(n) + " is too large for shifting.");
        }
        if (n < 0) return this.shiftLeft(-n);
        var result = this;
        while (n >= powers2Length) {
            if (result.isZero() || (result.isNegative() && result.isUnit())) return result;
            remQuo = divModAny(result, highestPower2);
            result = remQuo[1].isNegative() ? remQuo[0].prev() : remQuo[0];
            n -= powers2Length - 1;
        }
        remQuo = divModAny(result, powersOfTwo[n]);
        return remQuo[1].isNegative() ? remQuo[0].prev() : remQuo[0];
    };
    NativeBigInt.prototype.shiftRight = SmallInteger.prototype.shiftRight = BigInteger.prototype.shiftRight;

    function bitwise(x, y, fn) {
        y = parseValue(y);
        var xSign = x.isNegative(), ySign = y.isNegative();
        var xRem = xSign ? x.not() : x,
            yRem = ySign ? y.not() : y;
        var xDigit = 0, yDigit = 0;
        var xDivMod = null, yDivMod = null;
        var result = [];
        while (!xRem.isZero() || !yRem.isZero()) {
            xDivMod = divModAny(xRem, highestPower2);
            xDigit = xDivMod[1].toJSNumber();
            if (xSign) {
                xDigit = highestPower2 - 1 - xDigit; // two's complement for negative numbers
            }

            yDivMod = divModAny(yRem, highestPower2);
            yDigit = yDivMod[1].toJSNumber();
            if (ySign) {
                yDigit = highestPower2 - 1 - yDigit; // two's complement for negative numbers
            }

            xRem = xDivMod[0];
            yRem = yDivMod[0];
            result.push(fn(xDigit, yDigit));
        }
        var sum = fn(xSign ? 1 : 0, ySign ? 1 : 0) !== 0 ? bigInt(-1) : bigInt(0);
        for (var i = result.length - 1; i >= 0; i -= 1) {
            sum = sum.multiply(highestPower2).add(bigInt(result[i]));
        }
        return sum;
    }

    BigInteger.prototype.not = function () {
        return this.negate().prev();
    };
    NativeBigInt.prototype.not = SmallInteger.prototype.not = BigInteger.prototype.not;

    BigInteger.prototype.and = function (n) {
        return bitwise(this, n, function (a, b) { return a & b; });
    };
    NativeBigInt.prototype.and = SmallInteger.prototype.and = BigInteger.prototype.and;

    BigInteger.prototype.or = function (n) {
        return bitwise(this, n, function (a, b) { return a | b; });
    };
    NativeBigInt.prototype.or = SmallInteger.prototype.or = BigInteger.prototype.or;

    BigInteger.prototype.xor = function (n) {
        return bitwise(this, n, function (a, b) { return a ^ b; });
    };
    NativeBigInt.prototype.xor = SmallInteger.prototype.xor = BigInteger.prototype.xor;

    var LOBMASK_I = 1 << 30, LOBMASK_BI = (BASE & -BASE) * (BASE & -BASE) | LOBMASK_I;
    function roughLOB(n) { // get lowestOneBit (rough)
        // SmallInteger: return Min(lowestOneBit(n), 1 << 30)
        // BigInteger: return Min(lowestOneBit(n), 1 << 14) [BASE=1e7]
        var v = n.value,
            x = typeof v === "number" ? v | LOBMASK_I :
                typeof v === "bigint" ? v | BigInt(LOBMASK_I) :
                    v[0] + v[1] * BASE | LOBMASK_BI;
        return x & -x;
    }

    function integerLogarithm(value, base) {
        if (base.compareTo(value) <= 0) {
            var tmp = integerLogarithm(value, base.square(base));
            var p = tmp.p;
            var e = tmp.e;
            var t = p.multiply(base);
            return t.compareTo(value) <= 0 ? { p: t, e: e * 2 + 1 } : { p: p, e: e * 2 };
        }
        return { p: bigInt(1), e: 0 };
    }

    BigInteger.prototype.bitLength = function () {
        var n = this;
        if (n.compareTo(bigInt(0)) < 0) {
            n = n.negate().subtract(bigInt(1));
        }
        if (n.compareTo(bigInt(0)) === 0) {
            return bigInt(0);
        }
        return bigInt(integerLogarithm(n, bigInt(2)).e).add(bigInt(1));
    }
    NativeBigInt.prototype.bitLength = SmallInteger.prototype.bitLength = BigInteger.prototype.bitLength;

    function max(a, b) {
        a = parseValue(a);
        b = parseValue(b);
        return a.greater(b) ? a : b;
    }
    function min(a, b) {
        a = parseValue(a);
        b = parseValue(b);
        return a.lesser(b) ? a : b;
    }
    function gcd(a, b) {
        a = parseValue(a).abs();
        b = parseValue(b).abs();
        if (a.equals(b)) return a;
        if (a.isZero()) return b;
        if (b.isZero()) return a;
        var c = Integer[1], d, t;
        while (a.isEven() && b.isEven()) {
            d = min(roughLOB(a), roughLOB(b));
            a = a.divide(d);
            b = b.divide(d);
            c = c.multiply(d);
        }
        while (a.isEven()) {
            a = a.divide(roughLOB(a));
        }
        do {
            while (b.isEven()) {
                b = b.divide(roughLOB(b));
            }
            if (a.greater(b)) {
                t = b; b = a; a = t;
            }
            b = b.subtract(a);
        } while (!b.isZero());
        return c.isUnit() ? a : a.multiply(c);
    }
    function lcm(a, b) {
        a = parseValue(a).abs();
        b = parseValue(b).abs();
        return a.divide(gcd(a, b)).multiply(b);
    }
    function randBetween(a, b) {
        a = parseValue(a);
        b = parseValue(b);
        var low = min(a, b), high = max(a, b);
        var range = high.subtract(low).add(1);
        if (range.isSmall) return low.add(Math.floor(Math.random() * range));
        var digits = toBase(range, BASE).value;
        var result = [], restricted = true;
        for (var i = 0; i < digits.length; i++) {
            var top = restricted ? digits[i] : BASE;
            var digit = truncate(Math.random() * top);
            result.push(digit);
            if (digit < top) restricted = false;
        }
        return low.add(Integer.fromArray(result, BASE, false));
    }

    var parseBase = function (text, base, alphabet, caseSensitive) {
        alphabet = alphabet || DEFAULT_ALPHABET;
        text = String(text);
        if (!caseSensitive) {
            text = text.toLowerCase();
            alphabet = alphabet.toLowerCase();
        }
        var length = text.length;
        var i;
        var absBase = Math.abs(base);
        var alphabetValues = {};
        for (i = 0; i < alphabet.length; i++) {
            alphabetValues[alphabet[i]] = i;
        }
        for (i = 0; i < length; i++) {
            var c = text[i];
            if (c === "-") continue;
            if (c in alphabetValues) {
                if (alphabetValues[c] >= absBase) {
                    if (c === "1" && absBase === 1) continue;
                    throw new Error(c + " is not a valid digit in base " + base + ".");
                }
            }
        }
        base = parseValue(base);
        var digits = [];
        var isNegative = text[0] === "-";
        for (i = isNegative ? 1 : 0; i < text.length; i++) {
            var c = text[i];
            if (c in alphabetValues) digits.push(parseValue(alphabetValues[c]));
            else if (c === "<") {
                var start = i;
                do { i++; } while (text[i] !== ">" && i < text.length);
                digits.push(parseValue(text.slice(start + 1, i)));
            }
            else throw new Error(c + " is not a valid character");
        }
        return parseBaseFromArray(digits, base, isNegative);
    };

    function parseBaseFromArray(digits, base, isNegative) {
        var val = Integer[0], pow = Integer[1], i;
        for (i = digits.length - 1; i >= 0; i--) {
            val = val.add(digits[i].times(pow));
            pow = pow.times(base);
        }
        return isNegative ? val.negate() : val;
    }

    function stringify(digit, alphabet) {
        alphabet = alphabet || DEFAULT_ALPHABET;
        if (digit < alphabet.length) {
            return alphabet[digit];
        }
        return "<" + digit + ">";
    }

    function toBase(n, base) {
        base = bigInt(base);
        if (base.isZero()) {
            if (n.isZero()) return { value: [0], isNegative: false };
            throw new Error("Cannot convert nonzero numbers to base 0.");
        }
        if (base.equals(-1)) {
            if (n.isZero()) return { value: [0], isNegative: false };
            if (n.isNegative())
                return {
                    value: [].concat.apply([], Array.apply(null, Array(-n.toJSNumber()))
                        .map(Array.prototype.valueOf, [1, 0])
                    ),
                    isNegative: false
                };

            var arr = Array.apply(null, Array(n.toJSNumber() - 1))
                .map(Array.prototype.valueOf, [0, 1]);
            arr.unshift([1]);
            return {
                value: [].concat.apply([], arr),
                isNegative: false
            };
        }

        var neg = false;
        if (n.isNegative() && base.isPositive()) {
            neg = true;
            n = n.abs();
        }
        if (base.isUnit()) {
            if (n.isZero()) return { value: [0], isNegative: false };

            return {
                value: Array.apply(null, Array(n.toJSNumber()))
                    .map(Number.prototype.valueOf, 1),
                isNegative: neg
            };
        }
        var out = [];
        var left = n, divmod;
        while (left.isNegative() || left.compareAbs(base) >= 0) {
            divmod = left.divmod(base);
            left = divmod.quotient;
            var digit = divmod.remainder;
            if (digit.isNegative()) {
                digit = base.minus(digit).abs();
                left = left.next();
            }
            out.push(digit.toJSNumber());
        }
        out.push(left.toJSNumber());
        return { value: out.reverse(), isNegative: neg };
    }

    function toBaseString(n, base, alphabet) {
        var arr = toBase(n, base);
        return (arr.isNegative ? "-" : "") + arr.value.map(function (x) {
            return stringify(x, alphabet);
        }).join('');
    }

    BigInteger.prototype.toArray = function (radix) {
        return toBase(this, radix);
    };

    SmallInteger.prototype.toArray = function (radix) {
        return toBase(this, radix);
    };

    NativeBigInt.prototype.toArray = function (radix) {
        return toBase(this, radix);
    };

    BigInteger.prototype.toString = function (radix, alphabet) {
        if (radix === undefined) radix = 10;
        if (radix !== 10) return toBaseString(this, radix, alphabet);
        var v = this.value, l = v.length, str = String(v[--l]), zeros = "0000000", digit;
        while (--l >= 0) {
            digit = String(v[l]);
            str += zeros.slice(digit.length) + digit;
        }
        var sign = this.sign ? "-" : "";
        return sign + str;
    };

    SmallInteger.prototype.toString = function (radix, alphabet) {
        if (radix === undefined) radix = 10;
        if (radix != 10) return toBaseString(this, radix, alphabet);
        return String(this.value);
    };

    NativeBigInt.prototype.toString = SmallInteger.prototype.toString;

    NativeBigInt.prototype.toJSON = BigInteger.prototype.toJSON = SmallInteger.prototype.toJSON = function () { return this.toString(); }

    BigInteger.prototype.valueOf = function () {
        return parseInt(this.toString(), 10);
    };
    BigInteger.prototype.toJSNumber = BigInteger.prototype.valueOf;

    SmallInteger.prototype.valueOf = function () {
        return this.value;
    };
    SmallInteger.prototype.toJSNumber = SmallInteger.prototype.valueOf;
    NativeBigInt.prototype.valueOf = NativeBigInt.prototype.toJSNumber = function () {
        return parseInt(this.toString(), 10);
    }

    function parseStringValue(v) {
        if (isPrecise(+v)) {
            var x = +v;
            if (x === truncate(x))
                return supportsNativeBigInt ? new NativeBigInt(BigInt(x)) : new SmallInteger(x);
            throw new Error("Invalid integer: " + v);
        }
        var sign = v[0] === "-";
        if (sign) v = v.slice(1);
        var split = v.split(/e/i);
        if (split.length > 2) throw new Error("Invalid integer: " + split.join("e"));
        if (split.length === 2) {
            var exp = split[1];
            if (exp[0] === "+") exp = exp.slice(1);
            exp = +exp;
            if (exp !== truncate(exp) || !isPrecise(exp)) throw new Error("Invalid integer: " + exp + " is not a valid exponent.");
            var text = split[0];
            var decimalPlace = text.indexOf(".");
            if (decimalPlace >= 0) {
                exp -= text.length - decimalPlace - 1;
                text = text.slice(0, decimalPlace) + text.slice(decimalPlace + 1);
            }
            if (exp < 0) throw new Error("Cannot include negative exponent part for integers");
            text += (new Array(exp + 1)).join("0");
            v = text;
        }
        var isValid = /^([0-9][0-9]*)$/.test(v);
        if (!isValid) throw new Error("Invalid integer: " + v);
        if (supportsNativeBigInt) {
            return new NativeBigInt(BigInt(sign ? "-" + v : v));
        }
        var r = [], max = v.length, l = LOG_BASE, min = max - l;
        while (max > 0) {
            r.push(+v.slice(min, max));
            min -= l;
            if (min < 0) min = 0;
            max -= l;
        }
        trim(r);
        return new BigInteger(r, sign);
    }

    function parseNumberValue(v) {
        if (supportsNativeBigInt) {
            return new NativeBigInt(BigInt(v));
        }
        if (isPrecise(v)) {
            if (v !== truncate(v)) throw new Error(v + " is not an integer.");
            return new SmallInteger(v);
        }
        return parseStringValue(v.toString());
    }

    function parseValue(v) {
        if (typeof v === "number") {
            return parseNumberValue(v);
        }
        if (typeof v === "string") {
            return parseStringValue(v);
        }
        if (typeof v === "bigint") {
            return new NativeBigInt(v);
        }
        return v;
    }
    // Pre-define numbers in range [-999,999]
    for (var i = 0; i < 1000; i++) {
        Integer[i] = parseValue(i);
        if (i > 0) Integer[-i] = parseValue(-i);
    }
    // Backwards compatibility
    Integer.one = Integer[1];
    Integer.zero = Integer[0];
    Integer.minusOne = Integer[-1];
    Integer.max = max;
    Integer.min = min;
    Integer.gcd = gcd;
    Integer.lcm = lcm;
    Integer.isInstance = function (x) { return x instanceof BigInteger || x instanceof SmallInteger || x instanceof NativeBigInt; };
    Integer.randBetween = randBetween;

    Integer.fromArray = function (digits, base, isNegative) {
        return parseBaseFromArray(digits.map(parseValue), parseValue(base || 10), isNegative);
    };

    return Integer;
})();

// Node.js check
if (typeof module !== "undefined" && module.hasOwnProperty("exports")) {
    module.exports = bigInt;
}

//amd check
if (typeof define === "function" && define.amd) {
    define("big-integer", [], function () {
        return bigInt;
    });
}

},{}],2:[function(require,module,exports){
/*
    Copyright 2018 0kims association.

    This file is part of snarkjs.

    snarkjs is a free software: you can redistribute it and/or
    modify it under the terms of the GNU General Public License as published by the
    Free Software Foundation, either version 3 of the License, or (at your option)
    any later version.

    snarkjs is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
    more details.

    You should have received a copy of the GNU General Public License along with
    snarkjs. If not, see <https://www.gnu.org/licenses/>.
*/

exports.Circuit = require("./src/circuit.js");
exports.original = {
    setup: require("./src/setup_original.js"),
    genProof: require("./src/prover_original.js"),
    isValid: require("./src/verifier_original.js")
};
exports.groth = {
    setup: require("./src/setup_groth.js"),
    genProof: require("./src/prover_groth.js"),
    isValid: require("./src/verifier_groth.js")
};
exports.bigInt = require("./src/bigint.js");
exports.ZqField = require("./src/zqfield.js");

const Bn128 = require("./src/bn128.js");
exports.bn128 = new Bn128();

},{"./src/bigint.js":3,"./src/bn128.js":4,"./src/circuit.js":6,"./src/prover_groth.js":12,"./src/prover_original.js":13,"./src/setup_groth.js":14,"./src/setup_original.js":15,"./src/verifier_groth.js":17,"./src/verifier_original.js":18,"./src/zqfield.js":19}],3:[function(require,module,exports){
(function (Buffer){
/*
    Copyright 2018 0kims association.

    This file is part of snarkjs.

    snarkjs is a free software: you can redistribute it and/or
    modify it under the terms of the GNU General Public License as published by the
    Free Software Foundation, either version 3 of the License, or (at your option)
    any later version.

    snarkjs is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
    more details.

    You should have received a copy of the GNU General Public License along with
    snarkjs. If not, see <https://www.gnu.org/licenses/>.
*/

/* global BigInt */
const bigInt = require("big-integer");

let wBigInt;

if (typeof(BigInt) != "undefined") {
    wBigInt  = BigInt;
    wBigInt.one = wBigInt(1);
    wBigInt.zero = wBigInt(0);

    // Affine
    wBigInt.genAffine = (q) => {
        const nq = -q;
        return (a) => {
            let aux = a;
            if (aux < 0) {
                if (aux <= nq) {
                    aux = aux % q;
                }
                if (aux < wBigInt.zero) {
                    aux = aux + q;
                }
            } else {
                if (aux >= q) {
                    aux = aux % q;
                }
            }
            return aux.valueOf();
        };
    };


    // Inverse
    wBigInt.genInverse = (q) => {
        return (a) => {
            let t = wBigInt.zero;
            let r = q;
            let newt = wBigInt.one;
            let newr = wBigInt.affine(a, q);
            while (newr!=wBigInt.zero) {
                let q = r/newr;
                [t, newt] = [newt, t-q*newt];
                [r, newr] = [newr, r-q*newr];
            }
            if (t<wBigInt.zero) t += q;
            return t;
        };
    };


    // Add
    wBigInt.genAdd = (q) => {
        if (q) {
            return (a,b) => (a+b) % q;
        } else {
            return (a,b) => a+b;
        }
    };

    // Sub
    wBigInt.genSub = (q) => {
        if (q) {
            return (a,b) => (a-b) % q;
        } else {
            return (a,b) => a-b;
        }
    };


    // Neg
    wBigInt.genNeg = (q) => {
        if (q) {
            return (a) => (-a) % q;
        } else {
            return (a) => -a;
        }
    };

    // Mul
    wBigInt.genMul = (q) => {
        if (q) {
            return (a,b) => (a*b) % q;
        } else {
            return (a,b) => a*b;
        }
    };

    // Shr
    wBigInt.genShr = () => {
        return (a,b) => a >> wBigInt(b);
    };

    // Shl
    wBigInt.genShl = (q) => {
        if (q) {
            return (a,b) => (a << wBigInt(b)) % q;
        } else {
            return (a,b) => a << wBigInt(b);
        }
    };

    // Equals
    wBigInt.genEquals = (q) => {
        if (q) {
            return (a,b) => (a.affine(q) == b.affine(q));
        } else {
            return (a,b) => a == b;
        }
    };

    // Square
    wBigInt.genSquare = (q) => {
        if (q) {
            return (a) => (a*a) %q;
        } else {
            return (a) => a*a;
        }
    };


    // Double
    wBigInt.genDouble = (q) => {
        if (q) {
            return (a) => (a+a) %q;
        } else {
            return (a) => a+a;
        }
    };

    // IsZero
    wBigInt.genIsZero = (q) => {
        if (q) {
            return (a) => (a.affine(q) == wBigInt.zero);
        } else {
            return (a) =>  a == wBigInt.zero;
        }
    };


    // Other minor functions
    wBigInt.prototype.isOdd = function() {
        return (this & wBigInt.one) == wBigInt(1);
    };

    wBigInt.prototype.isNegative = function() {
        return this < wBigInt.zero;
    };

    wBigInt.prototype.and = function(m) {
        return this & m;
    };

    wBigInt.prototype.div = function(c) {
        return this / c;
    };

    wBigInt.prototype.mod = function(c) {
        return this % c;
    };

    wBigInt.prototype.modPow = function(e, m) {
        let acc = wBigInt.one;
        let exp = this;
        let rem = e;
        while (rem) {
            if (rem & wBigInt.one) {
                acc = (acc * exp) %m;
            }
            exp = (exp * exp) % m;
            rem = rem >> wBigInt.one;
        }
        return acc;
    };

    wBigInt.prototype.greaterOrEquals = function(b) {
        return this >= b;
    };

    wBigInt.prototype.greater = function(b) {
        return this > b;
    };
    wBigInt.prototype.gt = wBigInt.prototype.greater;

    wBigInt.prototype.lesserOrEquals = function(b) {
        return this <= b;
    };

    wBigInt.prototype.lesser = function(b) {
        return this < b;
    };
    wBigInt.prototype.lt = wBigInt.prototype.lesser;

    wBigInt.prototype.equals = function(b) {
        return this == b;
    };
    wBigInt.prototype.eq = wBigInt.prototype.equals;

    wBigInt.prototype.neq = function(b) {
        return this != b;
    };

} else {

    var oldProto = bigInt.prototype;
    wBigInt = function(a) {
        if ((typeof a == "string") && (a.slice(0,2) == "0x")) {
            return bigInt(a.slice(2), 16);
        } else {
            return bigInt(a);
        }
    };
    wBigInt.one = bigInt.one;
    wBigInt.zero = bigInt.zero;
    wBigInt.prototype = oldProto;

    wBigInt.prototype.div = function(c) {
        return this.divide(c);
    };

    // Affine
    wBigInt.genAffine = (q) => {
        const nq = wBigInt.zero.minus(q);
        return (a) => {
            let aux = a;
            if (aux.isNegative()) {
                if (aux.lesserOrEquals(nq)) {
                    aux = aux.mod(q);
                }
                if (aux.isNegative()) {
                    aux = aux.add(q);
                }
            } else {
                if (aux.greaterOrEquals(q)) {
                    aux = aux.mod(q);
                }
            }
            return aux;
        };
    };


    // Inverse
    wBigInt.genInverse = (q) => {
        return (a) => a.affine(q).modInv(q);
    };

    // Add
    wBigInt.genAdd = (q) => {
        if (q) {
            return (a,b) => {
                const r = a.add(b);
                return r.greaterOrEquals(q) ? r.minus(q) : r;
            };
        } else {
            return (a,b) => a.add(b);
        }
    };

    // Sub
    wBigInt.genSub = (q) => {
        if (q) {
            return (a,b) => a.greaterOrEquals(b) ? a.minus(b) : a.minus(b).add(q);
        } else {
            return (a,b) => a.minus(b);
        }
    };

    wBigInt.genNeg = (q) => {
        if (q) {
            return (a) => a.isZero() ? a : q.minus(a);
        } else {
            return (a) => wBigInt.zero.minus(a);
        }
    };

    // Mul
    wBigInt.genMul = (q) => {
        if (q) {
            return (a,b) => a.times(b).mod(q);
        } else {
            return (a,b) => a.times(b);
        }
    };

    // Shr
    wBigInt.genShr = () => {
        return (a,b) => a.shiftRight(wBigInt(b).value);
    };

    // Shr
    wBigInt.genShl = (q) => {
        if (q) {
            return (a,b) => a.shiftLeft(wBigInt(b).value).mod(q);
        } else {
            return (a,b) => a.shiftLeft(wBigInt(b).value);
        }
    };

    // Square
    wBigInt.genSquare = (q) => {
        if (q) {
            return (a) => a.square().mod(q);
        } else {
            return (a) => a.square();
        }
    };

    // Double
    wBigInt.genDouble = (q) => {
        if (q) {
            return (a) => a.add(a).mod(q);
        } else {
            return (a) => a.add(a);
        }
    };

    // Equals
    wBigInt.genEquals = (q) => {
        if (q) {
            return (a,b) => a.affine(q).equals(b.affine(q));
        } else {
            return (a,b) => a.equals(b);
        }
    };

    // IsZero
    wBigInt.genIsZero = (q) => {
        if (q) {
            return (a) => (a.affine(q).isZero());
        } else {
            return (a) =>  a.isZero();
        }
    };
}



wBigInt.affine = function(a, q) {
    return wBigInt.genAffine(q)(a);
};

wBigInt.prototype.affine = function (q) {
    return wBigInt.affine(this, q);
};

wBigInt.inverse = function(a, q) {
    return wBigInt.genInverse(q)(a);
};

wBigInt.prototype.inverse = function (q) {
    return wBigInt.genInverse(q)(this);
};

wBigInt.add = function(a, b, q) {
    return wBigInt.genAdd(q)(a,b);
};

wBigInt.prototype.add = function (a, q) {
    return wBigInt.genAdd(q)(this, a);
};

wBigInt.sub = function(a, b, q) {
    return wBigInt.genSub(q)(a,b);
};

wBigInt.prototype.sub = function (a, q) {
    return wBigInt.genSub(q)(this, a);
};

wBigInt.neg = function(a, q) {
    return wBigInt.genNeg(q)(a);
};

wBigInt.prototype.neg = function (q) {
    return wBigInt.genNeg(q)(this);
};

wBigInt.mul = function(a, b, q) {
    return wBigInt.genMul(q)(a,b);
};

wBigInt.prototype.mul = function (a, q) {
    return wBigInt.genMul(q)(this, a);
};

wBigInt.shr = function(a, b, q) {
    return wBigInt.genShr(q)(a,b);
};

wBigInt.prototype.shr = function (a, q) {
    return wBigInt.genShr(q)(this, a);
};

wBigInt.shl = function(a, b, q) {
    return wBigInt.genShl(q)(a,b);
};

wBigInt.prototype.shl = function (a, q) {
    return wBigInt.genShl(q)(this, a);
};

wBigInt.equals = function(a, b, q) {
    return wBigInt.genEquals(q)(a,b);
};

wBigInt.prototype.equals = function (a, q) {
    return wBigInt.genEquals(q)(this, a);
};

wBigInt.square = function(a, q) {
    return wBigInt.genSquare(q)(a);
};

wBigInt.prototype.square = function (q) {
    return wBigInt.genSquare(q)(this);
};

wBigInt.double = function(a, q) {
    return wBigInt.genDouble(q)(a);
};

wBigInt.prototype.double = function (q) {
    return wBigInt.genDouble(q)(this);
};

wBigInt.isZero = function(a, q) {
    return wBigInt.genIsZero(q)(a);
};

wBigInt.prototype.isZero = function (q) {
    return wBigInt.genIsZero(q)(this);
};

wBigInt.leBuff2int = function(buff) {
    let res = wBigInt.zero;
    for (let i=0; i<buff.length; i++) {
        const n = wBigInt(buff[i]);
        res = res.add(n.shl(i*8));
    }
    return res;
};

wBigInt.leInt2Buff = function(n, len) {
    let r = n;
    let o =0;
    const buff = Buffer.alloc(len);
    while ((r.greater(wBigInt.zero))&&(o<buff.length)) {
        let c = Number(r.and(wBigInt("255")));
        buff[o] = c;
        o++;
        r = r.shr(8);
    }
    if (r.greater(wBigInt.zero)) throw new Error("Number does not feed in buffer");
    return buff;
};

wBigInt.prototype.leInt2Buff = function (len) {
    return wBigInt.leInt2Buff(this,len);
};


module.exports = wBigInt;


}).call(this,require("buffer").Buffer)
},{"big-integer":1,"buffer":28}],4:[function(require,module,exports){
/*
    Copyright 2018 0kims association.

    This file is part of snarkjs.

    snarkjs is a free software: you can redistribute it and/or
    modify it under the terms of the GNU General Public License as published by the
    Free Software Foundation, either version 3 of the License, or (at your option)
    any later version.

    snarkjs is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
    more details.

    You should have received a copy of the GNU General Public License along with
    snarkjs. If not, see <https://www.gnu.org/licenses/>.
*/

const bigInt = require("./bigint.js");

const F1Field = require("./zqfield.js");
const F2Field = require("./f2field.js");
const F3Field = require("./f3field.js");
const GCurve = require("./gcurve.js");

class BN128 {

    constructor() {

        this.q = bigInt("21888242871839275222246405745257275088696311157297823662689037894645226208583");
        this.r = bigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617");
        this.g1 = [ bigInt(1), bigInt(2) ];
        this.g2 = [
            [
                bigInt("10857046999023057135944570762232829481370756359578518086990519993285655852781"),
                bigInt("11559732032986387107991004021392285783925812861821192530917403151452391805634")
            ],
            [
                bigInt("8495653923123431417604973247489272438418190587263600148770280649306958101930"),
                bigInt("4082367875863433681332203403145435568316851327593401208105741076214120093531")
            ]
        ];

        this.nonResidueF2 = bigInt("21888242871839275222246405745257275088696311157297823662689037894645226208582");
        this.nonResidueF6 = [ bigInt("9"), bigInt("1") ];

        this.F1 = new F1Field(this.q);
        this.F2 = new F2Field(this.F1, this.nonResidueF2);
        this.G1 = new GCurve(this.F1, this.g1);
        this.G2 = new GCurve(this.F2, this.g2);
        this.F6 = new F3Field(this.F2, this.nonResidueF6);
        this.F12 = new F2Field(this.F6, this.nonResidueF6);
        this.Fr = new F1Field(this.r);
        const self = this;
        this.F12._mulByNonResidue = function(a) {
            return [self.F2.mul(this.nonResidue, a[2]), a[0], a[1]];
        };

        this._preparePairing();

    }

    _preparePairing() {
        this.loopCount = bigInt("29793968203157093288");// CONSTANT

        // Set loopCountNeg
        if (this.loopCount.isNegative()) {
            this.loopCount = this.loopCount.neg();
            this.loopCountNeg = true;
        } else {
            this.loopCountNeg = false;
        }

        // Set loop_count_bits
        let lc = this.loopCount;
        this.loop_count_bits = []; // Constant
        while (!lc.isZero()) {
            this.loop_count_bits.push( lc.isOdd() );
            lc = lc.shr(1);
        }

        this.two_inv = this.F1.inverse(bigInt(2));

        this.coef_b = bigInt(3);
        this.twist = [bigInt(9) , bigInt(1)];
        this.twist_coeff_b = this.F2.mulScalar(  this.F2.inverse(this.twist), this.coef_b  );

        this.frobenius_coeffs_c1_1 = bigInt("21888242871839275222246405745257275088696311157297823662689037894645226208582");
        this.twist_mul_by_q_X =
            [
                bigInt("21575463638280843010398324269430826099269044274347216827212613867836435027261"),
                bigInt("10307601595873709700152284273816112264069230130616436755625194854815875713954")
            ];
        this.twist_mul_by_q_Y =
            [
                bigInt("2821565182194536844548159561693502659359617185244120367078079554186484126554"),
                bigInt("3505843767911556378687030309984248845540243509899259641013678093033130930403")
            ];

        this.final_exponent = bigInt("552484233613224096312617126783173147097382103762957654188882734314196910839907541213974502761540629817009608548654680343627701153829446747810907373256841551006201639677726139946029199968412598804882391702273019083653272047566316584365559776493027495458238373902875937659943504873220554161550525926302303331747463515644711876653177129578303191095900909191624817826566688241804408081892785725967931714097716709526092261278071952560171111444072049229123565057483750161460024353346284167282452756217662335528813519139808291170539072125381230815729071544861602750936964829313608137325426383735122175229541155376346436093930287402089517426973178917569713384748081827255472576937471496195752727188261435633271238710131736096299798168852925540549342330775279877006784354801422249722573783561685179618816480037695005515426162362431072245638324744480");

    }


    pairing(p1, p2) {

        const pre1 = this.precomputeG1(p1);
        const pre2 = this.precomputeG2(p2);

        const r1 = this.millerLoop(pre1, pre2);

        const res = this.finalExponentiation(r1);

        return res;
    }


    precomputeG1(p) {
        const Pcopy = this.G1.affine(p);

        const res = {};
        res.PX = Pcopy[0];
        res.PY = Pcopy[1];

        return res;
    }

    precomputeG2(p) {

        const Qcopy = this.G2.affine(p);

        const res = {
            QX: Qcopy[0],
            QY: Qcopy[1],
            coeffs: []
        };

        const R = {
            X: Qcopy[0],
            Y: Qcopy[1],
            Z: this.F2.one
        };

        let c;

        for (let i = this.loop_count_bits.length-2; i >= 0; --i)
        {
            const bit = this.loop_count_bits[i];

            c = this._doubleStep(R);
            res.coeffs.push(c);

            if (bit)
            {
                c = this._addStep(Qcopy, R);
                res.coeffs.push(c);
            }
        }

        const Q1 = this.G2.affine(this._g2MulByQ(Qcopy));
        if (!this.F2.equals(Q1[2], this.F2.one))
        {
            throw new Error("Expected values are not equal");
        }
        const Q2 = this.G2.affine(this._g2MulByQ(Q1));
        if (!this.F2.equals(Q2[2], this.F2.one))
        {
            throw new Error("Expected values are not equal");
        }

        if (this.loopCountNef)
        {
            R.Y = this.F2.neg(R.Y);
        }
        Q2[1] = this.F2.neg(Q2[1]);

        c = this._addStep(Q1, R);
        res.coeffs.push(c);

        c = this._addStep(Q2, R);
        res.coeffs.push(c);

        return res;
    }

    millerLoop(pre1, pre2) {
        let f = this.F12.one;

        let idx = 0;

        let c;

        for (let i = this.loop_count_bits.length-2; i >= 0; --i)
        {
            const bit = this.loop_count_bits[i];

            /* code below gets executed for all bits (EXCEPT the MSB itself) of
               alt_bn128_param_p (skipping leading zeros) in MSB to LSB
               order */

            c = pre2.coeffs[idx++];
            f = this.F12.square(f);
            f = this._mul_by_024(
                f,
                c.ell_0,
                this.F2.mulScalar(c.ell_VW , pre1.PY),
                this.F2.mulScalar(c.ell_VV , pre1.PX));

            if (bit)
            {
                c = pre2.coeffs[idx++];
                f = this._mul_by_024(
                    f,
                    c.ell_0,
                    this.F2.mulScalar(c.ell_VW, pre1.PY),
                    this.F2.mulScalar(c.ell_VV, pre1.PX));
            }

        }

        if (this.loopCountNef)
        {
            f = this.F12.inverse(f);
        }

        c = pre2.coeffs[idx++];
        f = this._mul_by_024(
            f,
            c.ell_0,
            this.F2.mulScalar(c.ell_VW, pre1.PY),
            this.F2.mulScalar(c.ell_VV, pre1.PX));

        c = pre2.coeffs[idx++];
        f = this._mul_by_024(
            f,
            c.ell_0,
            this.F2.mulScalar(c.ell_VW, pre1.PY),
            this.F2.mulScalar(c.ell_VV, pre1.PX));

        return f;
    }

    finalExponentiation(elt) {
        // TODO: There is an optimization in FF

        const res = this.F12.exp(elt,this.final_exponent);

        return res;
    }

    _doubleStep(current) {
        const X = current.X;
        const Y = current.Y;
        const Z = current.Z;

        const A = this.F2.mulScalar(this.F2.mul(X,Y), this.two_inv);                     // A = X1 * Y1 / 2
        const B = this.F2.square(Y);                           // B = Y1^2
        const C = this.F2.square(Z);                           // C = Z1^2
        const D = this.F2.add(C, this.F2.add(C,C));            // D = 3 * C
        const E = this.F2.mul(this.twist_coeff_b, D);     // E = twist_b * D
        const F = this.F2.add(E, this.F2.add(E,E));            // F = 3 * E
        const G =
            this.F2.mulScalar(
                this.F2.add( B , F ),
                this.two_inv);                            // G = (B+F)/2
        const H =
            this.F2.sub(
                this.F2.square( this.F2.add(Y,Z) ),
                this.F2.add( B , C));                          // H = (Y1+Z1)^2-(B+C)
        const I = this.F2.sub(E, B);                           // I = E-B
        const J = this.F2.square(X);                           // J = X1^2
        const E_squared = this.F2.square(E);                   // E_squared = E^2

        current.X = this.F2.mul( A, this.F2.sub(B,F) );        // X3 = A * (B-F)
        current.Y =
            this.F2.sub(
                this.F2.sub( this.F2.square(G) , E_squared ),
                this.F2.add( E_squared , E_squared ));         // Y3 = G^2 - 3*E^2
        current.Z = this.F2.mul( B, H );                       // Z3 = B * H
        const c = {
            ell_0 : this.F2.mul( I, this.twist),          // ell_0 = xi * I
            ell_VW: this.F2.neg( H ),                          // ell_VW = - H (later: * yP)
            ell_VV: this.F2.add( J , this.F2.add(J,J) )        // ell_VV = 3*J (later: * xP)
        };

        return c;
    }

    _addStep(base, current) {

        const X1 = current.X;
        const Y1 = current.Y;
        const Z1 = current.Z;
        const x2 = base[0];
        const y2 = base[1];

        const D = this.F2.sub( X1, this.F2.mul(x2,Z1) );  // D = X1 - X2*Z1
        const E = this.F2.sub( Y1, this.F2.mul(y2,Z1) );  // E = Y1 - Y2*Z1
        const F = this.F2.square(D);                      // F = D^2
        const G = this.F2.square(E);                      // G = E^2
        const H = this.F2.mul(D,F);                       // H = D*F
        const I = this.F2.mul(X1,F);                      // I = X1 * F
        const J =
            this.F2.sub(
                this.F2.add( H, this.F2.mul(Z1,G) ),
                this.F2.add( I, I ));                     // J = H + Z1*G - (I+I)

        current.X = this.F2.mul( D , J );                 // X3 = D*J
        current.Y =
            this.F2.sub(
                this.F2.mul( E , this.F2.sub(I,J) ),
                this.F2.mul( H , Y1));                    // Y3 = E*(I-J)-(H*Y1)
        current.Z = this.F2.mul(Z1,H);
        const c = {
            ell_0 :
                this.F2.mul(
                    this.twist,
                    this.F2.sub(
                        this.F2.mul(E , x2),
                        this.F2.mul(D , y2))),            // ell_0 = xi * (E * X2 - D * Y2)
            ell_VV : this.F2.neg(E),                      // ell_VV = - E (later: * xP)
            ell_VW : D                                    // ell_VW = D (later: * yP )
        };

        return c;
    }

    _mul_by_024(a, ell_0, ell_VW, ell_VV) {

        //  Old implementation

        const b = [
            [ell_0, this.F2.zero, ell_VV],
            [this.F2.zero, ell_VW, this.F2.zero]
        ];

        return this.F12.mul(a,b);

        /*
        // This is a new implementation,
        //  But it does not look worthy
        //  at least in javascript.

        let z0 = a[0][0];
        let z1 = a[0][1];
        let z2 = a[0][2];
        let z3 = a[1][0];
        let z4 = a[1][1];
        let z5 = a[1][2];

        const x0 = ell_0;
        const x2 = ell_VV;
        const x4 = ell_VW;

        const D0 = this.F2.mul(z0, x0);
        const D2 = this.F2.mul(z2, x2);
        const D4 = this.F2.mul(z4, x4);
        const t2 = this.F2.add(z0, z4);
        let t1 = this.F2.add(z0, z2);
        const s0 = this.F2.add(this.F2.add(z1,z3),z5);

        // For z.a_.a_ = z0.
        let S1 = this.F2.mul(z1, x2);
        let T3 = this.F2.add(S1, D4);
        let T4 = this.F2.add( this.F2.mul(this.nonResidueF6, T3),D0);
        z0 = T4;

        // For z.a_.b_ = z1
        T3 = this.F2.mul(z5, x4);
        S1 = this.F2.add(S1, T3);
        T3 = this.F2.add(T3, D2);
        T4 = this.F2.mul(this.nonResidueF6, T3);
        T3 = this.F2.mul(z1, x0);
        S1 = this.F2.add(S1, T3);
        T4 = this.F2.add(T4, T3);
        z1 = T4;

        // For z.a_.c_ = z2
        let t0 = this.F2.add(x0, x2);
        T3 = this.F2.sub(
            this.F2.mul(t1, t0),
            this.F2.add(D0, D2));
        T4 = this.F2.mul(z3, x4);
        S1 = this.F2.add(S1, T4);
        T3 = this.F2.add(T3, T4);

        // For z.b_.a_ = z3 (z3 needs z2)
        t0 = this.F2.add(z2, z4);
        z2 = T3;
        t1 = this.F2.add(x2, x4);
        T3 = this.F2.sub(
            this.F2.mul(t0,t1),
            this.F2.add(D2, D4));

        T4 = this.F2.mul(this.nonResidueF6,  T3);
        T3 = this.F2.mul(z3, x0);
        S1 = this.F2.add(S1, T3);
        T4 = this.F2.add(T4, T3);
        z3 = T4;

        // For z.b_.b_ = z4
        T3 = this.F2.mul(z5, x2);
        S1 = this.F2.add(S1, T3);
        T4 = this.F2.mul(this.nonResidueF6, T3);
        t0 = this.F2.add(x0, x4);
        T3 = this.F2.sub(
            this.F2.mul(t2,t0),
            this.F2.add(D0, D4));
        T4 = this.F2.add(T4, T3);
        z4 = T4;

        // For z.b_.c_ = z5.
        t0 = this.F2.add(this.F2.add(x0, x2), x4);
        T3 = this.F2.sub(this.F2.mul(s0, t0), S1);
        z5 = T3;

        return [
            [z0, z1, z2],
            [z3, z4, z5]
        ];

        */

    }

    _g2MulByQ(p) {
        const fmx = [p[0][0], this.F1.mul(p[0][1], this.frobenius_coeffs_c1_1 )];
        const fmy = [p[1][0], this.F1.mul(p[1][1], this.frobenius_coeffs_c1_1 )];
        const fmz = [p[2][0], this.F1.mul(p[2][1], this.frobenius_coeffs_c1_1 )];
        return [
            this.F2.mul(this.twist_mul_by_q_X , fmx),
            this.F2.mul(this.twist_mul_by_q_Y , fmy),
            fmz
        ];
    }
}

module.exports = BN128;

},{"./bigint.js":3,"./f2field.js":7,"./f3field.js":8,"./gcurve.js":10,"./zqfield.js":19}],5:[function(require,module,exports){
/*
    Copyright 2018 0kims association.

    This file is part of snarkjs.

    snarkjs is a free software: you can redistribute it and/or
    modify it under the terms of the GNU General Public License as published by the
    Free Software Foundation, either version 3 of the License, or (at your option)
    any later version.

    snarkjs is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
    more details.

    You should have received a copy of the GNU General Public License along with
    snarkjs. If not, see <https://www.gnu.org/licenses/>.
*/

const bigInt = require("./bigint");

module.exports = calculateWitness;

function calculateWitness(circuit, inputSignals, log) {
    log = log || (() => {});
    const ctx = new RTCtx(circuit, log);

    function iterateSelector(values, sels, cb) {
        if (!Array.isArray(values)) {
            return cb(sels, values);
        }
        for (let i=0; i<values.length; i++) {
            sels.push(i);
            iterateSelector(values[i], sels, cb);
            sels.pop(i);
        }
    }

    ctx.setSignal("one", [], bigInt(1));

    for (let c in ctx.notInitSignals) {
        if (ctx.notInitSignals[c] == 0) ctx.triggerComponent(c);
    }

    for (let s in inputSignals) {
        ctx.currentComponent = "main";
        iterateSelector(inputSignals[s], [], function(selector, value) {
            if (typeof(value) == "undefined") throw new Error("Signal not defined:" + s);
            ctx.setSignal(s, selector, bigInt(value));
        });
    }

    for (let i=0; i<circuit.nInputs; i++) {
        const idx = circuit.inputIdx(i);
        if (typeof(ctx.witness[idx]) == "undefined") {
            throw new Error("Input Signal not assigned: " + circuit.signalNames(idx));
        }
    }


    for (let i=0; i<ctx.witness.length; i++) {
        if (typeof(ctx.witness[i]) == "undefined") {
            throw new Error("Signal not assigned: " + circuit.signalNames(i));
        }
        log(circuit.signalNames(i) + " --> " + ctx.witness[i].toString());
    }
//    return ctx.witness.slice(0, circuit.nVars);
    return ctx.witness;
}

class RTCtx {
    constructor(circuit, log) {
        this.log = log || function() {};
        this.scopes = [];
        this.circuit = circuit;
        this.witness = new Array(circuit.nSignals);
        this.notInitSignals = {};
        for (let c in this.circuit.components) {
            this.notInitSignals[c] = this.circuit.components[c].inputSignals;
        }
    }

    _sels2str(sels) {
        let res = "";
        for (let i=0; i<sels.length; i++) {
            res += `[${sels[i]}]`;
        }
        return res;
    }

    setPin(componentName, componentSels, signalName, signalSels, value) {
        let fullName = componentName=="one" ? "one" : this.currentComponent + "." + componentName;
        fullName += this._sels2str(componentSels) +
                    "."+
                    signalName+
                    this._sels2str(signalSels);
        this.setSignalFullName(fullName, value);
    }

    setSignal(name, sels, value) {
        let fullName = this.currentComponent ? this.currentComponent + "." + name : name;
        fullName += this._sels2str(sels);
        this.setSignalFullName(fullName, value);
    }

    triggerComponent(c) {
        this.log("Component Treiggered: " + this.circuit.components[c].name);
//        console.log("Start Component Treiggered: " + this.circuit.components[c].name);

        // Set notInitSignals to -1 to not initialize again
        this.notInitSignals[c] --;
        const oldComponent = this.currentComponent;
        this.currentComponent = this.circuit.components[c].name;
        const template = this.circuit.components[c].template;

        const newScope = {};
        for (let p in this.circuit.components[c].params) {
            newScope[p] = this.circuit.components[c].params[p];
        }

        const oldScope = this.scopes;
        this.scopes = [ this.scopes[0], newScope ];

        // TODO set params.

        this.circuit.templates[template](this);
        this.scopes = oldScope;
        this.currentComponent = oldComponent;
//        console.log("End Component Treiggered: " + this.circuit.components[c].name);
    }

    callFunction(functionName, params) {

        const newScope = {};
        for (let p=0; p<this.circuit.functions[functionName].params.length; p++) {
            const paramName = this.circuit.functions[functionName].params[p];
            newScope[paramName] = params[p];
        }

        const oldScope = this.scopes;
        this.scopes = [ this.scopes[0], newScope ];

        // TODO set params.

        const res = this.circuit.functions[functionName].func(this);
        this.scopes = oldScope;

        return res;
    }

    setSignalFullName(fullName, value) {
        this.log("set " + fullName + " <-- " + value.toString());
        const sId = this.circuit.getSignalIdx(fullName);
        let firstInit =false;
        if (typeof(this.witness[sId]) == "undefined") {
            firstInit = true;
        }
        this.witness[sId] = bigInt(value);
        const callComponents = [];
        for (let i=0; i<this.circuit.signals[sId].triggerComponents.length; i++) {
            var idCmp = this.circuit.signals[sId].triggerComponents[i];
            if (firstInit) this.notInitSignals[idCmp] --;
            callComponents.push(idCmp);
        }
        callComponents.map( (c) => {
            if (this.notInitSignals[c] == 0) this.triggerComponent(c);
        });
        return this.witness[sId];
    }

    setVar(name, sels, value) {
        function setVarArray(a, sels2, value) {
            if (sels2.length == 1) {
                a[sels2[0]] = value;
            } else {
                if (typeof(a[sels2[0]]) == "undefined") a[sels2[0]] = [];
                setVarArray(a[sels2[0]], sels2.slice(1), value);
            }
        }
        const scope = this.scopes[this.scopes.length-1];
        if (sels.length == 0) {
            scope[name] = value;
        } else {
            if (typeof(scope[name]) == "undefined") scope[name] = [];
            setVarArray(scope[name], sels, value);
        }
        return value;
    }

    getVar(name, sels) {
        function select(a, sels2) {
            return  (sels2.length == 0) ? a : select(a[sels2[0]], sels2.slice(1));
        }
        for (let i=this.scopes.length-1; i>=0; i--) {
            if (typeof(this.scopes[i][name]) != "undefined") return select(this.scopes[i][name], sels);
        }
        throw new Error("Variable not defined: " + name);
    }

    getSignal(name, sels) {
        let fullName = name=="one" ? "one" : this.currentComponent + "." + name;
        fullName += this._sels2str(sels);
        return this.getSignalFullName(fullName);
    }


    getPin(componentName, componentSels, signalName, signalSels) {
        let fullName = componentName=="one" ? "one" : this.currentComponent + "." + componentName;
        fullName += this._sels2str(componentSels) +
                    "."+
                    signalName+
                    this._sels2str(signalSels);
        return this.getSignalFullName(fullName);
    }

    getSignalFullName(fullName) {
        const sId = this.circuit.getSignalIdx(fullName);
        if (typeof(this.witness[sId]) == "undefined") {
            throw new Error("Signal not initialized: "+fullName);
        }
        this.log("get --->" + fullName + " = " + this.witness[sId].toString() );
        return this.witness[sId];
    }

    assert(a,b) {
        const ba = bigInt(a);
        const bb = bigInt(b);
        if (!ba.equals(bb)) {
            throw new Error("Constraint doesn't match: " + ba.toString() + " != " + bb.toString());
        }
    }
}

},{"./bigint":3}],6:[function(require,module,exports){
/*
    Copyright 2018 0kims association.

    This file is part of snarkjs.

    snarkjs is a free software: you can redistribute it and/or
    modify it under the terms of the GNU General Public License as published by the
    Free Software Foundation, either version 3 of the License, or (at your option)
    any later version.

    snarkjs is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
    more details.

    You should have received a copy of the GNU General Public License along with
    snarkjs. If not, see <https://www.gnu.org/licenses/>.
*/

const bigInt = require("./bigint.js");

const __P__ = bigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617");
const __MASK__ = bigInt("28948022309329048855892746252171976963317496166410141009864396001978282409983"); // 0x3FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF
const calculateWitness = require("./calculateWitness.js");

module.exports = class Circuit {
    constructor(circuitDef) {
        this.nPubInputs = circuitDef.nPubInputs;
        this.nPrvInputs = circuitDef.nPrvInputs;
        this.nInputs = circuitDef.nInputs;
        this.nOutputs = circuitDef.nOutputs;
        this.nVars = circuitDef.nVars;
        this.nSignals = circuitDef.nSignals;
        this.nConstants = circuitDef.nConstants;

        this.nConstraints = circuitDef.constraints.length;

        this.signalName2Idx = circuitDef.signalName2Idx;
        this.components = circuitDef.components;
        this.componentName2Idx = circuitDef.componentName2Idx;
        this.signals = circuitDef.signals;
        this.constraints = circuitDef.constraints;

        this.templates = {};
        for (let t in circuitDef.templates) {
            this.templates[t] = eval(" const __f= " +circuitDef.templates[t] + "\n__f");
        }

        this.functions = {};
        for (let f in circuitDef.functions) {
            this.functions[f] = {
                params: circuitDef.functions[f].params,
                func: eval(" const __f= " +circuitDef.functions[f].func + "\n__f;")
            };
        }
    }

    calculateWitness(input, log) {
        return calculateWitness(this, input, log);
    }

    checkWitness(w) {
        const evalLC = (lc, w) => {
            let acc = bigInt(0);
            for (let k in lc) {
                acc=  acc.add(bigInt(w[k]).mul(bigInt(lc[k]))).mod(__P__);
            }
            return acc;
        }

        const checkConstraint = (ct, w) => {
            const a=evalLC(ct[0],w);
            const b=evalLC(ct[1],w);
            const c=evalLC(ct[2],w);
            const res = (a.mul(b).sub(c)).affine(__P__);
            if (!res.isZero()) return false;
            return true;
        }


        for (let i=0; i<this.constraints.length; i++) {
            if (!checkConstraint(this.constraints[i], w)) {
                this.printCostraint(this.constraints[i]);
                return false;
            }
        }

        return true;

    }

    printCostraint(c) {
        const lc2str = (lc) => {
            let S = "";
            for (let k in lc) {
                let name = this.signals[k].names[0];
                if (name == "one") name = "";
                let v = bigInt(lc[k]);
                let vs;
                if (!v.lesserOrEquals(__P__.shr(bigInt(1)))) {
                    v = __P__.sub(v);
                    vs = "-"+v.toString();
                } else {
                    if (S!="") {
                        vs = "+"+v.toString();
                    } else {
                        vs = "";
                    }
                    if (vs!="1") {
                        vs = vs + v.toString();;
                    }
                }

                S= S + " " + vs + name;
            }
            return S;
        };
        const S = `[ ${lc2str(c[0])} ] * [ ${lc2str(c[1])} ] - [ ${lc2str(c[2])} ] = 0`;
        console.log(S);
    }

    printConstraints() {
        for (let i=0; i<this.constraints.length; i++) {
            this.printCostraint(this.constraints[i]);
        }
    }

    getSignalIdx(name) {
        if (typeof(this.signalName2Idx[name]) != "undefined") return this.signalName2Idx[name];
        if (!isNaN(name)) return Number(name);
        throw new Error("Invalid signal identifier: "+ name);
    }

    // returns the index of the i'th output
    outputIdx(i) {
        if (i>=this.nOutputs) throw new Error("Accessing an invalid output: "+i);
        return i+1;
    }

    // returns the index of the i'th input
    inputIdx(i) {
        if (i>=this.nInputs) throw new Error("Accessing an invalid input: "+i);
        return this.nOutputs + 1 + i;
    }

    // returns the index of the i'th public input
    pubInputIdx(i) {
        if (i>=this.nPubInputs) throw new Error("Accessing an invalid pubInput: "+i);
        return this.inputIdx(i);
    }

    // returns the index of the i'th private input
    prvInputIdx(i) {
        if (i>=this.nPrvInputs) throw new Error("Accessing an invalid prvInput: "+i);
        return this.inputIdx(this.nPubInputs + i);
    }

    // returns the index of the i'th variable
    varIdx(i) {
        if (i>=this.nVars) throw new Error("Accessing an invalid variable: "+i);
        return i;
    }

    // returns the index of the i'th constant
    constantIdx(i) {
        if (i>=this.nConstants) throw new Error("Accessing an invalid constant: "+i);
        return this.nVars + i;
    }

    // returns the index of the i'th signal
    signalIdx(i) {
        if (i>=this.nSignls) throw new Error("Accessing an invalid signal: "+i);
        return i;
    }

    signalNames(i) {
        return this.signals[ this.getSignalIdx(i) ].names.join(", ");
    }

    a(constraint, signalIdx) {
        return bigInt(this.constraints[constraint][0][signalIdx] || 0 );
    }

    b(constraint, signalIdx) {
        return bigInt(this.constraints[constraint][1][signalIdx] || 0);
    }

    c(constraint, signalIdx) {
        return bigInt(this.constraints[constraint][2][signalIdx] || 0);
    }
};

},{"./bigint.js":3,"./calculateWitness.js":5}],7:[function(require,module,exports){
/*
    Copyright 2018 0kims association.

    This file is part of snarkjs.

    snarkjs is a free software: you can redistribute it and/or
    modify it under the terms of the GNU General Public License as published by the
    Free Software Foundation, either version 3 of the License, or (at your option)
    any later version.

    snarkjs is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
    more details.

    You should have received a copy of the GNU General Public License along with
    snarkjs. If not, see <https://www.gnu.org/licenses/>.
*/

const fUtils = require("./futils.js");

class F2Field {
    constructor(F, nonResidue) {
        this.F = F;
        this.zero = [this.F.zero, this.F.zero];
        this.one = [this.F.one, this.F.zero];
        this.nonResidue = nonResidue;
    }

    _mulByNonResidue(a) {
        return this.F.mul(this.nonResidue, a);
    }

    copy(a) {
        return [this.F.copy(a[0]), this.F.copy(a[1])];
    }

    add(a, b) {
        return [
            this.F.add(a[0], b[0]),
            this.F.add(a[1], b[1])
        ];
    }

    double(a) {
        return this.add(a,a);
    }

    sub(a, b) {
        return [
            this.F.sub(a[0], b[0]),
            this.F.sub(a[1], b[1])
        ];
    }

    neg(a) {
        return this.sub(this.zero, a);
    }

    mul(a, b) {
        const aA = this.F.mul(a[0] , b[0]);
        const bB = this.F.mul(a[1] , b[1]);

        return [
            this.F.add( aA , this._mulByNonResidue(bB)),
            this.F.sub(
                this.F.mul(
                    this.F.add(a[0], a[1]),
                    this.F.add(b[0], b[1])),
                this.F.add(aA, bB))];
    }

    inverse(a) {
        const t0 = this.F.square(a[0]);
        const t1 = this.F.square(a[1]);
        const t2 = this.F.sub(t0, this._mulByNonResidue(t1));
        const t3 = this.F.inverse(t2);
        return [
            this.F.mul(a[0], t3),
            this.F.neg(this.F.mul( a[1], t3)) ];
    }

    div(a, b) {
        return this.mul(a, this.inverse(b));
    }

    square(a) {
        const ab = this.F.mul(a[0] , a[1]);

        /*
        [
            (a + b) * (a + non_residue * b) - ab - non_residue * ab,
            ab + ab
        ];
        */

        return [
            this.F.sub(
                this.F.mul(
                    this.F.add(a[0], a[1]) ,
                    this.F.add(
                        a[0] ,
                        this._mulByNonResidue(a[1]))),
                this.F.add(
                    ab,
                    this._mulByNonResidue(ab))),
            this.F.add(ab, ab)
        ];
    }

    isZero(a) {
        return this.F.isZero(a[0]) && this.F.isZero(a[1]);
    }

    equals(a, b) {
        return this.F.equals(a[0], b[0]) && this.F.equals(a[1], b[1]);
    }

    affine(a) {
        return [this.F.affine(a[0]), this.F.affine(a[1])];
    }

    mulScalar(base, e) {
        return fUtils.mulScalar(this, base, e);
    }

    exp(base, e) {
        return fUtils.exp(this, base, e);
    }

    toString(a) {
        const cp = this.affine(a);
        return `[ ${this.F.toString(cp[0])} , ${this.F.toString(cp[1])} ]`;
    }
}

module.exports = F2Field;

},{"./futils.js":9}],8:[function(require,module,exports){
/*
    Copyright 2018 0kims association.

    This file is part of snarkjs.

    snarkjs is a free software: you can redistribute it and/or
    modify it under the terms of the GNU General Public License as published by the
    Free Software Foundation, either version 3 of the License, or (at your option)
    any later version.

    snarkjs is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
    more details.

    You should have received a copy of the GNU General Public License along with
    snarkjs. If not, see <https://www.gnu.org/licenses/>.
*/

const fUtils = require("./futils.js");

class F3Field {
    constructor(F, nonResidue) {
        this.F = F;
        this.zero = [this.F.zero, this.F.zero, this.F.zero];
        this.one = [this.F.one, this.F.zero, this.F.zero];
        this.nonResidue = nonResidue;
    }

    _mulByNonResidue(a) {
        return this.F.mul(this.nonResidue, a);
    }

    copy(a) {
        return [this.F.copy(a[0]), this.F.copy(a[1]), this.F.copy(a[2])];
    }

    add(a, b) {
        return [
            this.F.add(a[0], b[0]),
            this.F.add(a[1], b[1]),
            this.F.add(a[2], b[2])
        ];
    }

    double(a) {
        return this.add(a,a);
    }

    sub(a, b) {
        return [
            this.F.sub(a[0], b[0]),
            this.F.sub(a[1], b[1]),
            this.F.sub(a[2], b[2])
        ];
    }

    neg(a) {
        return this.sub(this.zero, a);
    }

    mul(a, b) {

        const aA = this.F.mul(a[0] , b[0]);
        const bB = this.F.mul(a[1] , b[1]);
        const cC = this.F.mul(a[2] , b[2]);

        return [
            this.F.add(
                aA,
                this._mulByNonResidue(
                    this.F.sub(
                        this.F.mul(
                            this.F.add(a[1], a[2]),
                            this.F.add(b[1], b[2])),
                        this.F.add(bB, cC)))),    // aA + non_residue*((b+c)*(B+C)-bB-cC),

            this.F.add(
                this.F.sub(
                    this.F.mul(
                        this.F.add(a[0], a[1]),
                        this.F.add(b[0], b[1])),
                    this.F.add(aA, bB)),
                this._mulByNonResidue( cC)),   // (a+b)*(A+B)-aA-bB+non_residue*cC

            this.F.add(
                this.F.sub(
                    this.F.mul(
                        this.F.add(a[0], a[2]),
                        this.F.add(b[0], b[2])),
                    this.F.add(aA, cC)),
                bB)];                           // (a+c)*(A+C)-aA+bB-cC)
    }

    inverse(a) {
        const t0 = this.F.square(a[0]);             // t0 = a^2 ;
        const t1 = this.F.square(a[1]);             // t1 = b^2 ;
        const t2 = this.F.square(a[2]);             // t2 = c^2;
        const t3 = this.F.mul(a[0],a[1]);           // t3 = ab
        const t4 = this.F.mul(a[0],a[2]);           // t4 = ac
        const t5 = this.F.mul(a[1],a[2]);           // t5 = bc;
        // c0 = t0 - non_residue * t5;
        const c0 = this.F.sub(t0, this._mulByNonResidue(t5));
        // c1 = non_residue * t2 - t3;
        const c1 = this.F.sub(this._mulByNonResidue(t2), t3);
        const c2 = this.F.sub(t1, t4);              // c2 = t1-t4

        // t6 = (a * c0 + non_residue * (c * c1 + b * c2)).inverse();
        const t6 =
            this.F.inverse(
                this.F.add(
                    this.F.mul(a[0], c0),
                    this._mulByNonResidue(
                        this.F.add(
                            this.F.mul(a[2], c1),
                            this.F.mul(a[1], c2)))));

        return [
            this.F.mul(t6, c0),         // t6*c0
            this.F.mul(t6, c1),         // t6*c1
            this.F.mul(t6, c2)];        // t6*c2
    }

    div(a, b) {
        return this.mul(a, this.inverse(b));
    }

    square(a) {
        const s0 = this.F.square(a[0]);                   // s0 = a^2
        const ab = this.F.mul(a[0], a[1]);                // ab = a*b
        const s1 = this.F.add(ab, ab);                    // s1 = 2ab;
        const s2 = this.F.square(
            this.F.add(this.F.sub(a[0],a[1]), a[2]));     // s2 = (a - b + c)^2;
        const bc = this.F.mul(a[1],a[2]);                 // bc = b*c
        const s3 = this.F.add(bc, bc);                    // s3 = 2*bc
        const s4 = this.F.square(a[2]);                   // s4 = c^2


        return [
            this.F.add(
                s0,
                this._mulByNonResidue(s3)),           // s0 + non_residue * s3,
            this.F.add(
                s1,
                this._mulByNonResidue(s4)),           // s1 + non_residue * s4,
            this.F.sub(
                this.F.add( this.F.add(s1, s2) , s3 ),
                this.F.add(s0, s4))];                      // s1 + s2 + s3 - s0 - s4
    }

    isZero(a) {
        return this.F.isZero(a[0]) && this.F.isZero(a[1]) && this.F.isZero(a[2]);
    }

    equals(a, b) {
        return this.F.equals(a[0], b[0]) && this.F.equals(a[1], b[1]) && this.F.equals(a[2], b[2]);
    }

    affine(a) {
        return [this.F.affine(a[0]), this.F.affine(a[1]), this.F.affine(a[2])];
    }

    mulScalar(base, e) {
        return fUtils.mulScalar(this, base, e);
    }

    exp(base, e) {
        return fUtils.exp(this, base, e);
    }

    toString(a) {
        const cp = this.affine(a);
        return `[ ${this.F.toString(cp[0])} , ${this.F.toString(cp[1])}, ${this.F.toString(cp[2])} ]`;
    }
}

module.exports = F3Field;

},{"./futils.js":9}],9:[function(require,module,exports){
/*
    Copyright 2018 0kims association.

    This file is part of snarkjs.

    snarkjs is a free software: you can redistribute it and/or
    modify it under the terms of the GNU General Public License as published by the
    Free Software Foundation, either version 3 of the License, or (at your option)
    any later version.

    snarkjs is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
    more details.

    You should have received a copy of the GNU General Public License along with
    snarkjs. If not, see <https://www.gnu.org/licenses/>.
*/

const bigInt = require("./bigint.js");

exports.mulScalar = (F, base, e) =>{
    let res = F.zero;
    let rem = bigInt(e);
    let exp = base;

    while (! rem.isZero()) {
        if (rem.isOdd()) {
            res = F.add(res, exp);
        }
        exp = F.double(exp);
        rem = rem.shr(1);
    }

    return res;
};


exports.exp = (F, base, e) =>{
    let res = F.one;
    let rem = bigInt(e);
    let exp = base;

    while (! rem.isZero()) {
        if (rem.isOdd()) {
            res = F.mul(res, exp);
        }
        exp = F.square(exp);
        rem = rem.shr(1);
    }

    return res;
};

},{"./bigint.js":3}],10:[function(require,module,exports){
/*
    Copyright 2018 0kims association.

    This file is part of snarkjs.

    snarkjs is a free software: you can redistribute it and/or
    modify it under the terms of the GNU General Public License as published by the
    Free Software Foundation, either version 3 of the License, or (at your option)
    any later version.

    snarkjs is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
    more details.

    You should have received a copy of the GNU General Public License along with
    snarkjs. If not, see <https://www.gnu.org/licenses/>.
*/

const fUtils = require("./futils.js");

class GCurve {

    constructor(F, g) {
        this.F = F;
        this.g = [F.copy(g[0]), F.copy(g[1])];
        if (this.g.length == 2) this.g[2] = this.F.one;
        this.zero = [this.F.zero, this.F.one, this.F.zero];
    }

    isZero(p) {
        return this.F.isZero(p[2]);
    }

    add(p1, p2) {

        const F = this.F;

        if (this.isZero(p1)) return p2;
        if (this.isZero(p2)) return p1;

        const res = new Array(3);

        const Z1Z1 = F.square( p1[2] );
        const Z2Z2 = F.square( p2[2] );

        const U1 = F.mul( p1[0] , Z2Z2 );     // U1 = X1  * Z2Z2
        const U2 = F.mul( p2[0] , Z1Z1 );     // U2 = X2  * Z1Z1

        const Z1_cubed = F.mul( p1[2] , Z1Z1);
        const Z2_cubed = F.mul( p2[2] , Z2Z2);

        const S1 = F.mul( p1[1] , Z2_cubed);  // S1 = Y1 * Z2 * Z2Z2
        const S2 = F.mul( p2[1] , Z1_cubed);  // S2 = Y2 * Z1 * Z1Z1

        if (F.equals(U1,U2) && F.equals(S1,S2)) {
            return this.double(p1);
        }

        const H = F.sub( U2 , U1 );                    // H = U2-U1

        const S2_minus_S1 = F.sub( S2 , S1 );

        const I = F.square( F.add(H,H) );         // I = (2 * H)^2
        const J = F.mul( H , I );                      // J = H * I

        const r = F.add( S2_minus_S1 , S2_minus_S1 );  // r = 2 * (S2-S1)
        const V = F.mul( U1 , I );                     // V = U1 * I

        res[0] =
            F.sub(
                F.sub( F.square(r) , J ),
                F.add( V , V ));                       // X3 = r^2 - J - 2 * V

        const S1_J = F.mul( S1 , J );

        res[1] =
            F.sub(
                F.mul( r , F.sub(V,res[0])),
                F.add( S1_J,S1_J ));                   // Y3 = r * (V-X3)-2 S1 J

        res[2] =
            F.mul(
                H,
                F.sub(
                    F.square( F.add(p1[2],p2[2]) ),
                    F.add( Z1Z1 , Z2Z2 )));            // Z3 = ((Z1+Z2)^2-Z1Z1-Z2Z2) * H

        return res;
    }

    neg(p) {
        return [p[0], this.F.neg(p[1]), p[2]];
    }

    sub(a, b) {
        return this.add(a, this.neg(b));
    }

    double(p) {
        const F = this.F;

        const res = new Array(3);

        if (this.isZero(p)) return p;

        const A = F.square( p[0] );                    // A = X1^2
        const B = F.square( p[1] );                    // B = Y1^2
        const C = F.square( B );                       // C = B^2

        let D =
            F.sub(
                F.square( F.add(p[0] , B )),
                F.add( A , C));
        D = F.add(D,D);                    // D = 2 * ((X1 + B)^2 - A - C)

        const E = F.add( F.add(A,A), A);          // E = 3 * A
        const FF =F.square( E );                       // F = E^2

        res[0] = F.sub( FF , F.add(D,D) );         // X3 = F - 2 D

        let eightC = F.add( C , C );
        eightC = F.add( eightC , eightC );
        eightC = F.add( eightC , eightC );

        res[1] =
            F.sub(
                F.mul(
                    E,
                    F.sub( D, res[0] )),
                eightC);                                    // Y3 = E * (D - X3) - 8 * C

        const Y1Z1 = F.mul( p[1] , p[2] );
        res[2] = F.add( Y1Z1 , Y1Z1 );                 // Z3 = 2 * Y1 * Z1

        return res;
    }

    mulScalar(base, e) {
        return fUtils.mulScalar(this, base, e);
    }

    affine(p) {
        const F = this.F;
        if (this.isZero(p)) {
            return this.zero;
        } else {
            const Z_inv = F.inverse(p[2]);
            const Z2_inv = F.square(Z_inv);
            const Z3_inv = F.mul(Z2_inv, Z_inv);

            const res = new Array(3);
            res[0] = F.affine( F.mul(p[0],Z2_inv));
            res[1] = F.affine( F.mul(p[1],Z3_inv));
            res[2] = F.one;

            return res;
        }
    }

    equals(p1, p2) {
        const F = this.F;

        if (this.isZero(p1)) return this.isZero(p2);
        if (this.isZero(p2)) return this.isZero(p1);

        const Z1Z1 = F.square( p1[2] );
        const Z2Z2 = F.square( p2[2] );

        const U1 = F.mul( p1[0] , Z2Z2 );
        const U2 = F.mul( p2[0] , Z1Z1 );

        const Z1_cubed = F.mul( p1[2] , Z1Z1);
        const Z2_cubed = F.mul( p2[2] , Z2Z2);

        const S1 = F.mul( p1[1] , Z2_cubed);
        const S2 = F.mul( p2[1] , Z1_cubed);

        return (F.equals(U1,U2) && F.equals(S1,S2));
    }

    toString(p) {
        const cp = this.affine(p);
        return `[ ${this.F.toString(cp[0])} , ${this.F.toString(cp[1])} ]`;
    }

}

module.exports = GCurve;


},{"./futils.js":9}],11:[function(require,module,exports){
/*
    Copyright 2018 0kims association.

    This file is part of snarkjs.

    snarkjs is a free software: you can redistribute it and/or
    modify it under the terms of the GNU General Public License as published by the
    Free Software Foundation, either version 3 of the License, or (at your option)
    any later version.

    snarkjs is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
    more details.

    You should have received a copy of the GNU General Public License along with
    snarkjs. If not, see <https://www.gnu.org/licenses/>.
*/

/*
    This library does operations on polynomials with coefficients in a field F.

    A polynomial P(x) = p0 + p1 * x + p2 * x^2 + ... + pn * x^n  is represented
    by the array [ p0, p1, p2, ... , pn ].
 */

const bigInt = require("./bigint.js");

class PolField {
    constructor (F) {
        this.F = F;

        const q = this.F.q;
        let rem = q.sub(bigInt(1));
        let s = 0;
        while (!rem.isOdd()) {
            s ++;
            rem = rem.shr(1);
        }

        const five = this.F.add(this.F.add(this.F.two, this.F.two), this.F.one);

        this.w = new Array(s+1);
        this.wi = new Array(s+1);
        this.w[s] = this.F.exp(five, rem);
        this.wi[s] = this.F.inverse(this.w[s]);

        let n=s-1;
        while (n>=0) {
            this.w[n] = this.F.square(this.w[n+1]);
            this.wi[n] = this.F.square(this.wi[n+1]);
            n--;
        }


        this.roots = [];
/*        for (let i=0; i<16; i++) {
            let r = this.F.one;
            n = 1 << i;
            const rootsi = new Array(n);
            for (let j=0; j<n; j++) {
                rootsi[j] = r;
                r = this.F.mul(r, this.w[i]);
            }

            this.roots.push(rootsi);
        }
    */
        this._setRoots(15);
    }

    _setRoots(n) {
        for (let i=n; (i>=0) && (!this.roots[i]); i--) {
            let r = this.F.one;
            const nroots = 1 << i;
            const rootsi = new Array(nroots);
            for (let j=0; j<nroots; j++) {
                rootsi[j] = r;
                r = this.F.mul(r, this.w[i]);
            }

            this.roots[i] = rootsi;
        }
    }

    add(a, b) {
        const m = Math.max(a.length, b.length);
        const res = new Array(m);
        for (let i=0; i<m; i++) {
            res[i] = this.F.add(a[i] || this.F.zero, b[i] || this.F.zero);
        }
        return this.reduce(res);
    }

    double(a) {
        return this.add(a,a);
    }

    sub(a, b) {
        const m = Math.max(a.length, b.length);
        const res = new Array(m);
        for (let i=0; i<m; i++) {
            res[i] = this.F.sub(a[i] || this.F.zero, b[i] || this.F.zero);
        }
        return this.reduce(res);
    }

    mulScalar(p, b) {
        if (this.F.isZero(b)) return [];
        if (this.F.equals(b, this.F.one)) return p;
        const res = new Array(p.length);
        for (let i=0; i<p.length; i++) {
            res[i] = this.F.mul(p[i], b);
        }
        return res;
    }



    mul(a, b) {
        if (a.length == 0) return [];
        if (b.length == 0) return [];
        if (a.length == 1) return this.mulScalar(b, a[0]);
        if (b.length == 1) return this.mulScalar(a, b[0]);

        if (b.length > a.length) {
            [b, a] = [a, b];
        }

        if ((b.length <= 2) || (b.length < log2(a.length))) {
            return this.mulNormal(a,b);
        } else {
            return this.mulFFT(a,b);
        }
    }

    mulNormal(a, b) {
        let res = [];
        b = this.affine(b);
        for (let i=0; i<b.length; i++) {
            res = this.add(res, this.scaleX(this.mulScalar(a, b[i]), i) );
        }
        return res;
    }

    mulFFT(a,b) {
        const longestN = Math.max(a.length, b.length);
        const bitsResult = log2(longestN-1)+2;
        this._setRoots(bitsResult);

        const m = 1 << bitsResult;
        const ea = this.extend(a,m);
        const eb = this.extend(b,m);

        const ta = __fft(this, ea, bitsResult, 0, 1, false);
        const tb = __fft(this, eb, bitsResult, 0, 1, false);

        const tres = new Array(m);

        for (let i=0; i<m; i++) {
            tres[i] = this.F.mul(ta[i], tb[i]);
        }

        const res = __fft(this, tres, bitsResult, 0, 1, true);

        const twoinvm = this.F.inverse( this.F.mulScalar(this.F.one, m) );
        const resn = new Array(m);
        for (let i=0; i<m; i++) {
            resn[i] = this.F.mul(res[(m-i)%m], twoinvm);
        }

        return this.reduce(this.affine(resn));
    }



    square(a) {
        return this.mul(a,a);
    }

    scaleX(p, n) {
        if (n==0) {
            return p;
        } else if (n>0) {
            const z = new Array(n).fill(this.F.zero);
            return z.concat(p);
        } else {
            if (-n >= p.length) return [];
            return p.slice(-n);
        }
    }

    eval2(p, x) {
        let v = this.F.zero;
        let ix = this.F.one;
        for (let i=0; i<p.length; i++) {
            v = this.F.add(v, this.F.mul(p[i], ix));
            ix = this.F.mul(ix, x);
        }
        return v;
    }

/*    this.eval(p,x) {
        const F = this.F;
        if (p.length == 0) return F.zero;
        const m = this._next2Power(p.length);
        const ep = this.extend(p, m);

        return _eval(ep, x, 0, 1, m);

        function _eval(p, x, offset, step, n) {
            if (n==1) return p[offset];
            const newX = F.square(x);
            const res= F.add(
                _eval(p, newX, offset, step << 1, n >> 1),
                F.mul(
                    x,
                    _eval(p, newX, offset+step , step << 1, n >> 1)));
            return res;
        }
    }*/

    lagrange(points) {
        let roots = [this.F.one];
        for (let i=0; i<points.length; i++) {
            roots = this.mul(roots, [this.F.neg(points[i][0]), this.F.one]);
        }

        let sum = [];
        for (let i=0; i<points.length; i++) {
            let mpol = this.ruffini(roots, points[i][0]);
            const factor =
                this.F.mul(
                    this.F.inverse(this.eval(mpol, points[i][0])),
                    points[i][1]);
            mpol = this.mulScalar(mpol, factor);
            sum = this.add(sum, mpol);
        }
        return sum;
    }


    fft(p) {
        if (p.length <= 1) return p;
        const bits = log2(p.length-1)+1;
        this._setRoots(bits);

        const m = 1 << bits;
        const ep = this.extend(p, m);
        const res = __fft(this, ep, bits, 0, 1);
        return res;
    }

    ifft(p) {

        if (p.length <= 1) return p;
        const bits = log2(p.length-1)+1;
        this._setRoots(bits);
        const m = 1 << bits;
        const ep = this.extend(p, m);
        const res =  __fft(this, ep, bits, 0, 1);

        const twoinvm = this.F.inverse( this.F.mulScalar(this.F.one, m) );
        const resn = new Array(m);
        for (let i=0; i<m; i++) {
            resn[i] = this.F.mul(res[(m-i)%m], twoinvm);
        }

        return resn;

    }


    _fft(pall, bits, offset, step) {

        const n = 1 << bits;
        if (n==1) {
            return [ pall[offset] ];
        }

        const ndiv2 = n >> 1;
        const p1 = this._fft(pall, bits-1, offset, step*2);
        const p2 = this._fft(pall, bits-1, offset+step, step*2);

        const out = new Array(n);

        let m= this.F.one;
        for (let i=0; i<ndiv2; i++) {
            out[i] = this.F.add(p1[i], this.F.mul(m, p2[i]));
            out[i+ndiv2] = this.F.sub(p1[i], this.F.mul(m, p2[i]));
            m = this.F.mul(m, this.w[bits]);
        }

        return out;
    }

    extend(p, e) {
        if (e == p.length) return p;
        const z = new Array(e-p.length).fill(this.F.zero);

        return p.concat(z);
    }

    reduce(p) {
        if (p.length == 0) return p;
        if (! this.F.isZero(p[p.length-1]) ) return p;
        let i=p.length-1;
        while( i>0 && this.F.isZero(p[i]) ) i--;
        return p.slice(0, i+1);
    }

    affine(p) {
        for (let i=0; i<p.length; i++) {
            p[i] = this.F.affine(p[i]);
        }
        return p;
    }

    equals(a, b) {
        const pa = this.reduce(this.affine(a));
        const pb = this.reduce(this.affine(b));

        if (pa.length != pb.length) return false;
        for (let i=0; i<pb.length; i++) {
            if (!this.F.equals(pa[i], pb[i])) return false;
        }

        return true;
    }

    ruffini(p, r) {
        const res = new Array(p.length-1);
        res[res.length-1] = p[p.length-1];
        for (let i = res.length-2; i>=0; i--) {
            res[i] = this.F.add(this.F.mul(res[i+1], r), p[i+1]);
        }
        return res;
    }

    _next2Power(v) {
        v--;
        v |= v >> 1;
        v |= v >> 2;
        v |= v >> 4;
        v |= v >> 8;
        v |= v >> 16;
        v++;
        return v;
    }

    toString(p) {
        const ap = this.affine(p);
        let S = "";
        for (let i=ap.length-1; i>=0; i--) {
            if (!this.F.isZero(p[i])) {
                if (S!="") S += " + ";
                S = S + p[i].toString(10);
                if (i>0) {
                    S = S + "x";
                    if (i>1) {
                        S = S + "^" +i;
                    }
                }
            }
        }
        return S;
    }


    _reciprocal(p, bits) {
        const k = 1 << bits;
        if (k==1) {
            return [ this.F.inverse(p[0]) ];
        }
        const np = this.scaleX(p, -k/2);
        const q = this._reciprocal(np, bits-1);
        const a = this.scaleX(this.double(q), 3*k/2-2);
        const b = this.mul( this.square(q), p);

        return this.scaleX(this.sub(a,b),   -(k-2));
    }

    // divides x^m / v
    _div2(m, v) {
        const kbits = log2(v.length-1)+1;
        const k = 1 << kbits;

        const scaleV = k - v.length;

        // rec = x^(k - 2) / v* x^scaleV =>
        // rec = x^(k-2-scaleV)/ v
        //
        // res = x^m/v = x^(m + (2*k-2 - scaleV) - (2*k-2 - scaleV)) /v =>
        // res = rec * x^(m - (2*k-2 - scaleV)) =>
        // res = rec * x^(m - 2*k + 2 + scaleV)

        const rec = this._reciprocal(this.scaleX(v, scaleV), kbits);
        const res = this.scaleX(rec, m - 2*k + 2 + scaleV);

        return res;
    }

    div(_u, _v) {
        if (_u.length < _v.length) return [];
        const kbits = log2(_v.length-1)+1;
        const k = 1 << kbits;

        const u = this.scaleX(_u, k-_v.length);
        const v = this.scaleX(_v, k-_v.length);

        const n = v.length-1;
        let m = u.length-1;

        const s = this._reciprocal(v, kbits);
        let t;
        if (m>2*n) {
            t = this.sub(this.scaleX([this.F.one], 2*n), this.mul(s, v));
        }

        let q = [];
        let rem = u;
        let us, ut;
        let finish = false;

        while (!finish) {
            us = this.mul(rem, s);
            q = this.add(q, this.scaleX(us, -2*n));

            if ( m > 2*n ) {
                ut = this.mul(rem, t);
                rem = this.scaleX(ut, -2*n);
                m = rem.length-1;
            } else {
                finish = true;
            }
        }

        return q;
    }


    // returns the ith nth-root of one
    oneRoot(n, i) {
        let nbits = log2(n-1)+1;
        let res = this.F.one;
        let r = i;

        if(i>=n) {
            throw new Error("Given 'i' should be lower than 'n'");
        }
        else if (1<<nbits !== n) {
            throw new Error(`Internal errlr: ${n} should equal ${1<<nbits}`);
        }

        while (r>0) {
            if (r & 1 == 1) {
                res = this.F.mul(res, this.w[nbits]);
            }
            r = r >> 1;
            nbits --;
        }
        return res;
    }

    computeVanishingPolinomial(bits, t) {
        const m = 1 << bits;
        return this.F.sub(this.F.exp(t, bigInt(m)), this.F.one);
    }

    evaluateLagrangePolynomials(bits, t) {
        const m= 1 << bits;
        const tm = this.F.exp(t, bigInt(m));
        const u= new Array(m).fill(this.F.zero);
        this._setRoots(bits);
        const omega = this.w[bits];

        if (this.F.equals(tm, this.F.one)) {
            for (let i = 0; i < m; i++) {
                if (this.F.equals(this.roots[bits][0],t)) { // i.e., t equals omega^i
                    u[i] = this.F.one;
                    return u;
                }
            }
        }

        const z = this.F.sub(tm, this.F.one);
//        let l = this.F.mul(z,  this.F.exp(this.F.twoinv, m));
        let l = this.F.mul(z,  this.F.inverse(bigInt(m)));
        for (let i = 0; i < m; i++) {
            u[i] = this.F.mul(l, this.F.inverse(this.F.sub(t,this.roots[bits][i])));
            l = this.F.mul(l, omega);
        }

        return u;
    }

    log2(V) {
        return log2(V);
    }
}

function log2( V )
{
    return( ( ( V & 0xFFFF0000 ) !== 0 ? ( V &= 0xFFFF0000, 16 ) : 0 ) | ( ( V & 0xFF00FF00 ) !== 0 ? ( V &= 0xFF00FF00, 8 ) : 0 ) | ( ( V & 0xF0F0F0F0 ) !== 0 ? ( V &= 0xF0F0F0F0, 4 ) : 0 ) | ( ( V & 0xCCCCCCCC ) !== 0 ? ( V &= 0xCCCCCCCC, 2 ) : 0 ) | ( ( V & 0xAAAAAAAA ) !== 0 ) );
}


function __fft(PF, pall, bits, offset, step) {

    const n = 1 << bits;
    if (n==1) {
        return [ pall[offset] ];
    } else if (n==2) {
        return [
            PF.F.add(pall[offset], pall[offset + step]),
            PF.F.sub(pall[offset], pall[offset + step])];
    }

    const ndiv2 = n >> 1;
    const p1 = __fft(PF, pall, bits-1, offset, step*2);
    const p2 = __fft(PF, pall, bits-1, offset+step, step*2);

    const out = new Array(n);

    for (let i=0; i<ndiv2; i++) {
        out[i] = PF.F.add(p1[i], PF.F.mul(PF.roots[bits][i], p2[i]));
        out[i+ndiv2] = PF.F.sub(p1[i], PF.F.mul(PF.roots[bits][i], p2[i]));
    }

    return out;
}


module.exports = PolField;

},{"./bigint.js":3}],12:[function(require,module,exports){
/*
    Copyright 2018 0kims association.

    This file is part of snarkjs.

    snarkjs is a free software: you can redistribute it and/or
    modify it under the terms of the GNU General Public License as published by the
    Free Software Foundation, either version 3 of the License, or (at your option)
    any later version.

    snarkjs is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
    more details.

    You should have received a copy of the GNU General Public License along with
    snarkjs. If not, see <https://www.gnu.org/licenses/>.
*/

/* Implementation of this paper: https://eprint.iacr.org/2016/260.pdf */

const BN128 = require("./bn128.js");
const PolField = require("./polfield.js");
const ZqField = require("./zqfield.js");

const bn128 = new BN128();
const PolF = new PolField(new ZqField(bn128.r));
const G1 = bn128.G1;
const G2 = bn128.G2;

module.exports = function genProof(vk_proof, witness) {

    const proof = {};

    const r = PolF.F.random();
    const s = PolF.F.random();

    proof.pi_a = G1.zero;
    proof.pi_b = G2.zero;
    proof.pi_c = G1.zero;

    let pib1 = G1.zero;


    // Skip public entries and the "1" signal that are forced by the verifier

    for (let s= 0; s< vk_proof.nVars; s++) {
        // pi_a = pi_a + A[s] * witness[s];
        proof.pi_a = G1.add( proof.pi_a, G1.mulScalar( vk_proof.A[s], witness[s]));

        // pi_b = pi_b + B[s] * witness[s];
        proof.pi_b = G2.add( proof.pi_b, G2.mulScalar( vk_proof.B2[s], witness[s]));

        pib1 = G1.add( pib1, G1.mulScalar( vk_proof.B1[s], witness[s]));
    }

    for (let s= vk_proof.nPublic+1; s< vk_proof.nVars; s++) {

        // pi_a  = pi_a  + A[s]  * witness[s];
        proof.pi_c  = G1.add( proof.pi_c, G1.mulScalar( vk_proof.C[s], witness[s]));
    }

    proof.pi_a  = G1.add( proof.pi_a, vk_proof.vk_alfa_1 );
    proof.pi_a  = G1.add( proof.pi_a, G1.mulScalar( vk_proof.vk_delta_1, r ));

    proof.pi_b  = G2.add( proof.pi_b, vk_proof.vk_beta_2 );
    proof.pi_b  = G2.add( proof.pi_b, G2.mulScalar( vk_proof.vk_delta_2, s ));

    pib1 = G1.add( pib1, vk_proof.vk_beta_1 );
    pib1 = G1.add( pib1, G1.mulScalar( vk_proof.vk_delta_1, s ));

    const h = calculateH(vk_proof, witness, PolF.F.zero, PolF.F.zero, PolF.F.zero);

//    console.log(h.length + "/" + vk_proof.hExps.length);

    for (let i = 0; i < h.length; i++) {
        proof.pi_c = G1.add( proof.pi_c, G1.mulScalar( vk_proof.hExps[i], h[i]));
    }


    proof.pi_c  = G1.add( proof.pi_c, G1.mulScalar( proof.pi_a, s ));
    proof.pi_c  = G1.add( proof.pi_c, G1.mulScalar( pib1, r ));
    proof.pi_c  = G1.add( proof.pi_c, G1.mulScalar( vk_proof.vk_delta_1, PolF.F.affine(PolF.F.neg(PolF.F.mul(r,s) ))));


    const publicSignals = witness.slice(1, vk_proof.nPublic+1);

    proof.pi_a = G1.affine(proof.pi_a);
    proof.pi_b = G2.affine(proof.pi_b);
    proof.pi_c = G1.affine(proof.pi_c);

    proof.protocol = "groth";

    return {proof, publicSignals};
};


function calculateH(vk_proof, witness, d1, d2, d3) {

    const F = PolF.F;
    const m = vk_proof.domainSize;
    const polA_T = new Array(m).fill(PolF.F.zero);
    const polB_T = new Array(m).fill(PolF.F.zero);
    const polC_T = new Array(m).fill(PolF.F.zero);

    for (let s=0; s<vk_proof.nVars; s++) {
        for (let c in vk_proof.polsA[s]) {
            polA_T[c] = F.add(polA_T[c], F.mul(witness[s], vk_proof.polsA[s][c]));
        }
        for (let c in vk_proof.polsB[s]) {
            polB_T[c] = F.add(polB_T[c], F.mul(witness[s], vk_proof.polsB[s][c]));
        }
        for (let c in vk_proof.polsC[s]) {
            polC_T[c] = F.add(polC_T[c], F.mul(witness[s], vk_proof.polsC[s][c]));
        }
    }

    const polA_S = PolF.ifft(polA_T);
    const polB_S = PolF.ifft(polB_T);

    const polAB_S = PolF.mul(polA_S, polB_S);

    const polC_S = PolF.ifft(polC_T);

    const polABC_S = PolF.sub(polAB_S, polC_S);

    const polZ_S = new Array(m+1).fill(F.zero);
    polZ_S[m] = F.one;
    polZ_S[0] = F.neg(F.one);

    let H_S = PolF.div(polABC_S, polZ_S);
/*
    const H2S = PolF.mul(H_S, polZ_S);

    if (PolF.equals(H2S, polABC_S)) {
        console.log("Is Divisible!");
    } else {
        console.log("ERROR: Not divisible!");
    }
*/

    /* add coefficients of the polynomial (d2*A + d1*B - d3) + d1*d2*Z */

    H_S = PolF.extend(H_S, m+1);

    for (let i=0; i<m; i++) {
        const d2A = PolF.F.mul(d2, polA_S[i]);
        const d1B = PolF.F.mul(d1, polB_S[i]);
        H_S[i] = PolF.F.add(H_S[i], PolF.F.add(d2A, d1B));
    }

    H_S[0] = PolF.F.sub(H_S[0], d3);

    // Z = x^m -1
    const d1d2 = PolF.F.mul(d1, d2);
    H_S[m] = PolF.F.add(H_S[m], d1d2);
    H_S[0] = PolF.F.sub(H_S[0], d1d2);

    H_S = PolF.reduce(PolF.affine(H_S));

    return H_S;
}

},{"./bn128.js":4,"./polfield.js":11,"./zqfield.js":19}],13:[function(require,module,exports){
/*
    Copyright 2018 0kims association.

    This file is part of snarkjs.

    snarkjs is a free software: you can redistribute it and/or
    modify it under the terms of the GNU General Public License as published by the
    Free Software Foundation, either version 3 of the License, or (at your option)
    any later version.

    snarkjs is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
    more details.

    You should have received a copy of the GNU General Public License along with
    snarkjs. If not, see <https://www.gnu.org/licenses/>.
*/

const BN128 = require("./bn128.js");
const PolField = require("./polfield.js");
const ZqField = require("./zqfield.js");

const bn128 = new BN128();
const PolF = new PolField(new ZqField(bn128.r));
const G1 = bn128.G1;
const G2 = bn128.G2;

module.exports = function genProof(vk_proof, witness) {

    const proof = {};


    const d1 = PolF.F.random();
    const d2 = PolF.F.random();
    const d3 = PolF.F.random();

    proof.pi_a = G1.zero;
    proof.pi_ap = G1.zero;
    proof.pi_b = G2.zero;
    proof.pi_bp = G1.zero;
    proof.pi_c = G1.zero;
    proof.pi_cp = G1.zero;
    proof.pi_kp = G1.zero;
    proof.pi_h = G1.zero;


    // Skip public entries and the "1" signal that are forced by the verifier
    for (let s= vk_proof.nPublic+1; s< vk_proof.nVars; s++) {

        // pi_a  = pi_a  + A[s]  * witness[s];
        proof.pi_a  = G1.add( proof.pi_a, G1.mulScalar( vk_proof.A[s], witness[s]));

        // pi_ap = pi_ap + Ap[s] * witness[s];
        proof.pi_ap = G1.add( proof.pi_ap, G1.mulScalar( vk_proof.Ap[s], witness[s]));
    }

    for (let s= 0; s< vk_proof.nVars; s++) {
        // pi_a  = pi_a  + A[s]  * witness[s];
        proof.pi_b  = G2.add( proof.pi_b, G2.mulScalar( vk_proof.B[s], witness[s]));

        // pi_ap = pi_ap + Ap[s] * witness[s];
        proof.pi_bp = G1.add( proof.pi_bp, G1.mulScalar( vk_proof.Bp[s], witness[s]));

        // pi_a  = pi_a  + A[s]  * witness[s];
        proof.pi_c  = G1.add( proof.pi_c, G1.mulScalar( vk_proof.C[s], witness[s]));

        // pi_ap = pi_ap + Ap[s] * witness[s];
        proof.pi_cp = G1.add( proof.pi_cp, G1.mulScalar( vk_proof.Cp[s], witness[s]));

        // pi_ap = pi_ap + Ap[s] * witness[s];
        proof.pi_kp = G1.add( proof.pi_kp, G1.mulScalar( vk_proof.Kp[s], witness[s]));
    }

    proof.pi_a  = G1.add( proof.pi_a, G1.mulScalar( vk_proof.A[vk_proof.nVars], d1));
    proof.pi_ap  = G1.add( proof.pi_ap, G1.mulScalar( vk_proof.Ap[vk_proof.nVars], d1));

    proof.pi_b  = G2.add( proof.pi_b, G2.mulScalar( vk_proof.B[vk_proof.nVars], d2));
    proof.pi_bp  = G1.add( proof.pi_bp, G1.mulScalar( vk_proof.Bp[vk_proof.nVars], d2));

    proof.pi_c  = G1.add( proof.pi_c, G1.mulScalar( vk_proof.C[vk_proof.nVars], d3));
    proof.pi_cp  = G1.add( proof.pi_cp, G1.mulScalar( vk_proof.Cp[vk_proof.nVars], d3));

    proof.pi_kp  = G1.add( proof.pi_kp, G1.mulScalar( vk_proof.Kp[vk_proof.nVars  ], d1));
    proof.pi_kp  = G1.add( proof.pi_kp, G1.mulScalar( vk_proof.Kp[vk_proof.nVars+1], d2));
    proof.pi_kp  = G1.add( proof.pi_kp, G1.mulScalar( vk_proof.Kp[vk_proof.nVars+2], d3));

/*
    let polA = [];
    let polB = [];
    let polC = [];

    for (let s= 0; s< vk_proof.nVars; s++) {
        polA = PolF.add(
            polA,
            PolF.mul(
                vk_proof.polsA[s],
                [witness[s]] ));

        polB = PolF.add(
            polB,
            PolF.mul(
                vk_proof.polsB[s],
                [witness[s]] ));

        polC = PolF.add(
            polC,
            PolF.mul(
                vk_proof.polsC[s],
                [witness[s]] ));
    }


    let polFull = PolF.sub(PolF.mul( polA, polB), polC);

    const h = PolF.div(polFull, vk_proof.polZ );
*/

    const h = calculateH(vk_proof, witness, d1, d2, d3);

//    console.log(h.length + "/" + vk_proof.hExps.length);

    for (let i = 0; i < h.length; i++) {
        proof.pi_h = G1.add( proof.pi_h, G1.mulScalar( vk_proof.hExps[i], h[i]));
    }

    proof.pi_a = G1.affine(proof.pi_a);
    proof.pi_b = G2.affine(proof.pi_b);
    proof.pi_c = G1.affine(proof.pi_c);
    proof.pi_ap = G1.affine(proof.pi_ap);
    proof.pi_bp = G1.affine(proof.pi_bp);
    proof.pi_cp = G1.affine(proof.pi_cp);
    proof.pi_kp = G1.affine(proof.pi_kp);
    proof.pi_h = G1.affine(proof.pi_h);

//    proof.h=h;

    proof.protocol = "original";

    const publicSignals = witness.slice(1, vk_proof.nPublic+1);

    return {proof, publicSignals};
};


function calculateH(vk_proof, witness, d1, d2, d3) {

    const F = PolF.F;
    const m = vk_proof.domainSize;
    const polA_T = new Array(m).fill(PolF.F.zero);
    const polB_T = new Array(m).fill(PolF.F.zero);
    const polC_T = new Array(m).fill(PolF.F.zero);

    for (let s=0; s<vk_proof.nVars; s++) {
        for (let c in vk_proof.polsA[s]) {
            polA_T[c] = F.add(polA_T[c], F.mul(witness[s], vk_proof.polsA[s][c]));
        }
        for (let c in vk_proof.polsB[s]) {
            polB_T[c] = F.add(polB_T[c], F.mul(witness[s], vk_proof.polsB[s][c]));
        }
        for (let c in vk_proof.polsC[s]) {
            polC_T[c] = F.add(polC_T[c], F.mul(witness[s], vk_proof.polsC[s][c]));
        }
    }

    const polA_S = PolF.ifft(polA_T);
    const polB_S = PolF.ifft(polB_T);

    const polAB_S = PolF.mul(polA_S, polB_S);

    const polC_S = PolF.ifft(polC_T);

    const polABC_S = PolF.sub(polAB_S, polC_S);

    const polZ_S = new Array(m+1).fill(F.zero);
    polZ_S[m] = F.one;
    polZ_S[0] = F.neg(F.one);

    let H_S = PolF.div(polABC_S, polZ_S);
/*
    const H2S = PolF.mul(H_S, polZ_S);

    if (PolF.equals(H2S, polABC_S)) {
        console.log("Is Divisible!");
    } else {
        console.log("ERROR: Not divisible!");
    }
*/

    /* add coefficients of the polynomial (d2*A + d1*B - d3) + d1*d2*Z */

    H_S = PolF.extend(H_S, m+1);

    for (let i=0; i<m; i++) {
        const d2A = PolF.F.mul(d2, polA_S[i]);
        const d1B = PolF.F.mul(d1, polB_S[i]);
        H_S[i] = PolF.F.add(H_S[i], PolF.F.add(d2A, d1B));
    }

    H_S[0] = PolF.F.sub(H_S[0], d3);

    // Z = x^m -1
    const d1d2 = PolF.F.mul(d1, d2);
    H_S[m] = PolF.F.add(H_S[m], d1d2);
    H_S[0] = PolF.F.sub(H_S[0], d1d2);

    H_S = PolF.reduce(PolF.affine(H_S));

    return H_S;
}

},{"./bn128.js":4,"./polfield.js":11,"./zqfield.js":19}],14:[function(require,module,exports){
/*
    Copyright 2018 0kims association.

    This file is part of snarkjs.

    snarkjs is a free software: you can redistribute it and/or
    modify it under the terms of the GNU General Public License as published by the
    Free Software Foundation, either version 3 of the License, or (at your option)
    any later version.

    snarkjs is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
    more details.

    You should have received a copy of the GNU General Public License along with
    snarkjs. If not, see <https://www.gnu.org/licenses/>.
*/

/* Implementation of this paper: https://eprint.iacr.org/2016/260.pdf */

const bigInt = require("./bigint.js");

const BN128 = require("./bn128.js");
const PolField = require("./polfield.js");
const ZqField = require("./zqfield.js");

const bn128 = new BN128();
const G1 = bn128.G1;
const G2 = bn128.G2;
const PolF = new PolField(new ZqField(bn128.r));
const F = new ZqField(bn128.r);

module.exports = function setup(circuit) {
    const setup = {
        vk_proof : {
            protocol: "groth",
            nVars: circuit.nVars,
            nPublic: circuit.nPubInputs + circuit.nOutputs
        },
        vk_verifier: {
            protocol: "groth",
            nPublic: circuit.nPubInputs + circuit.nOutputs
        },
        toxic: {}
    };


    setup.vk_proof.domainBits = PolF.log2(circuit.nConstraints + circuit.nPubInputs + circuit.nOutputs +1 -1) +1;
    setup.vk_proof.domainSize = 1 << setup.vk_proof.domainBits;

    calculatePolinomials(setup, circuit);
    setup.toxic.t = F.random();
    calculateEncriptedValuesAtT(setup, circuit);

    return setup;
};


function calculatePolinomials(setup, circuit) {

    setup.vk_proof.polsA = new Array(circuit.nVars);
    setup.vk_proof.polsB = new Array(circuit.nVars);
    setup.vk_proof.polsC = new Array(circuit.nVars);
    for (let i=0; i<circuit.nVars; i++) {
        setup.vk_proof.polsA[i] = {};
        setup.vk_proof.polsB[i] = {};
        setup.vk_proof.polsC[i] = {};
    }
    for (let c=0; c<circuit.nConstraints; c++) {

        for (let s in circuit.constraints[c][0]) {
            setup.vk_proof.polsA[s][c] = bigInt(circuit.constraints[c][0][s]);
        }
        for (let s in circuit.constraints[c][1]) {
            setup.vk_proof.polsB[s][c] = bigInt(circuit.constraints[c][1][s]);
        }
        for (let s in circuit.constraints[c][2]) {
            setup.vk_proof.polsC[s][c] = bigInt(circuit.constraints[c][2][s]);
        }
    }

    /**
     * add and process the constraints
     *     input_i * 0 = 0
     * to ensure soundness of input consistency
     */
    for (let i = 0; i < circuit.nPubInputs + circuit.nOutputs + 1; ++i)
    {
        setup.vk_proof.polsA[i][circuit.nConstraints + i] = F.one;
    }
}

function calculateValuesAtT(setup, circuit) {
    const z_t = PolF.computeVanishingPolinomial(setup.vk_proof.domainBits, setup.toxic.t);
    const u = PolF.evaluateLagrangePolynomials(setup.vk_proof.domainBits, setup.toxic.t);

    const a_t = new Array(circuit.nVars).fill(F.zero);
    const b_t = new Array(circuit.nVars).fill(F.zero);
    const c_t = new Array(circuit.nVars).fill(F.zero);

    // TODO: substitute setup.polsA for coeficients
    for (let s=0; s<circuit.nVars; s++) {
        for (let c in setup.vk_proof.polsA[s]) {
            a_t[s] = F.add(a_t[s], F.mul(u[c], setup.vk_proof.polsA[s][c]));
        }
        for (let c in setup.vk_proof.polsB[s]) {
            b_t[s] = F.add(b_t[s], F.mul(u[c], setup.vk_proof.polsB[s][c]));
        }
        for (let c in setup.vk_proof.polsC[s]) {
            c_t[s] = F.add(c_t[s], F.mul(u[c], setup.vk_proof.polsC[s][c]));
        }
    }

    return {a_t, b_t, c_t, z_t};

}




function calculateEncriptedValuesAtT(setup, circuit) {

    const v = calculateValuesAtT(setup, circuit);
    setup.vk_proof.A = new Array(circuit.nVars);
    setup.vk_proof.B1 = new Array(circuit.nVars);
    setup.vk_proof.B2 = new Array(circuit.nVars);
    setup.vk_proof.C = new Array(circuit.nVars);
    setup.vk_verifier.IC = new Array(circuit.nPublic);

    setup.toxic.kalfa = F.random();
    setup.toxic.kbeta = F.random();
    setup.toxic.kgamma = F.random();
    setup.toxic.kdelta = F.random();

    let invDelta = F.inverse(setup.toxic.kdelta);
    let invGamma = F.inverse(setup.toxic.kgamma);

    setup.vk_proof.vk_alfa_1 = G1.affine(G1.mulScalar( G1.g, setup.toxic.kalfa));
    setup.vk_proof.vk_beta_1 = G1.affine(G1.mulScalar( G1.g, setup.toxic.kbeta));
    setup.vk_proof.vk_delta_1 = G1.affine(G1.mulScalar( G1.g, setup.toxic.kdelta));

    setup.vk_proof.vk_beta_2 = G2.affine(G2.mulScalar( G2.g, setup.toxic.kbeta));
    setup.vk_proof.vk_delta_2 = G2.affine(G2.mulScalar( G2.g, setup.toxic.kdelta));


    setup.vk_verifier.vk_alfa_1 = G1.affine(G1.mulScalar( G1.g, setup.toxic.kalfa));

    setup.vk_verifier.vk_beta_2 = G2.affine(G2.mulScalar( G2.g, setup.toxic.kbeta));
    setup.vk_verifier.vk_gamma_2 = G2.affine(G2.mulScalar( G2.g, setup.toxic.kgamma));
    setup.vk_verifier.vk_delta_2 = G2.affine(G2.mulScalar( G2.g, setup.toxic.kdelta));

    setup.vk_verifier.vk_alfabeta_12 = bn128.F12.affine(bn128.pairing( setup.vk_verifier.vk_alfa_1 , setup.vk_verifier.vk_beta_2 ));

    for (let s=0; s<circuit.nVars; s++) {

        const A = G1.affine(G1.mulScalar(G1.g, v.a_t[s]));

        setup.vk_proof.A[s] = A;

        const B1 = G1.affine(G1.mulScalar(G1.g, v.b_t[s]));

        setup.vk_proof.B1[s] = B1;

        const B2 = G2.affine(G2.mulScalar(G2.g, v.b_t[s]));

        setup.vk_proof.B2[s] = B2;
    }

    for (let s=0; s<=setup.vk_proof.nPublic; s++) {
        let ps =
            F.mul(
                invGamma,
                F.add(
                    F.add(
                        F.mul(v.a_t[s], setup.toxic.kbeta),
                        F.mul(v.b_t[s], setup.toxic.kalfa)),
                    v.c_t[s]));

        const IC = G1.affine(G1.mulScalar(G1.g, ps));
        setup.vk_verifier.IC[s]=IC;
    }

    for (let s=setup.vk_proof.nPublic+1; s<circuit.nVars; s++) {
        let ps =
            F.mul(
                invDelta,
                F.add(
                    F.add(
                        F.mul(v.a_t[s], setup.toxic.kbeta),
                        F.mul(v.b_t[s], setup.toxic.kalfa)),
                    v.c_t[s]));
        const C = G1.affine(G1.mulScalar(G1.g, ps));
        setup.vk_proof.C[s]=C;
    }

    // Calculate HExps

    const maxH = setup.vk_proof.domainSize+1;

    setup.vk_proof.hExps = new Array(maxH);

    const zod = F.mul(invDelta, v.z_t);

    setup.vk_proof.hExps[0] = G1.affine(G1.mulScalar(G1.g, zod));
    let eT = setup.toxic.t;
    for (let i=1; i<maxH; i++) {
        setup.vk_proof.hExps[i] = G1.affine(G1.mulScalar(G1.g, F.mul(eT, zod)));
        eT = F.mul(eT, setup.toxic.t);
    }
}


},{"./bigint.js":3,"./bn128.js":4,"./polfield.js":11,"./zqfield.js":19}],15:[function(require,module,exports){
/*
    Copyright 2018 0kims association.

    This file is part of snarkjs.

    snarkjs is a free software: you can redistribute it and/or
    modify it under the terms of the GNU General Public License as published by the
    Free Software Foundation, either version 3 of the License, or (at your option)
    any later version.

    snarkjs is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
    more details.

    You should have received a copy of the GNU General Public License along with
    snarkjs. If not, see <https://www.gnu.org/licenses/>.
*/

const bigInt = require("./bigint.js");

const BN128 = require("./bn128.js");
const PolField = require("./polfield.js");
const ZqField = require("./zqfield.js");

const bn128 = new BN128();
const G1 = bn128.G1;
const G2 = bn128.G2;
const PolF = new PolField(new ZqField(bn128.r));
const F = new ZqField(bn128.r);

module.exports = function setup(circuit) {
    const setup = {
        vk_proof : {
            protocol: "original",
            nVars: circuit.nVars,
            nPublic: circuit.nPubInputs + circuit.nOutputs
        },
        vk_verifier: {
            protocol: "original",
            nPublic: circuit.nPubInputs + circuit.nOutputs
        },
        toxic: {}
    };


    setup.vk_proof.domainBits = PolF.log2(circuit.nConstraints + circuit.nPubInputs + circuit.nOutputs +1 -1) +1;
    setup.vk_proof.domainSize = 1 << setup.vk_proof.domainBits;

    calculatePolinomials(setup, circuit);
    setup.toxic.t = F.random();
    calculateEncriptedValuesAtT(setup, circuit);
    calculateHexps(setup, circuit);

    return setup;
};


function calculatePolinomials(setup, circuit) {

    setup.vk_proof.polsA = new Array(circuit.nVars);
    setup.vk_proof.polsB = new Array(circuit.nVars);
    setup.vk_proof.polsC = new Array(circuit.nVars);
    for (let i=0; i<circuit.nVars; i++) {
        setup.vk_proof.polsA[i] = {};
        setup.vk_proof.polsB[i] = {};
        setup.vk_proof.polsC[i] = {};
    }
    for (let c=0; c<circuit.nConstraints; c++) {

        for (let s in circuit.constraints[c][0]) {
            setup.vk_proof.polsA[s][c] = bigInt(circuit.constraints[c][0][s]);
        }
        for (let s in circuit.constraints[c][1]) {
            setup.vk_proof.polsB[s][c] = bigInt(circuit.constraints[c][1][s]);
        }
        for (let s in circuit.constraints[c][2]) {
            setup.vk_proof.polsC[s][c] = bigInt(circuit.constraints[c][2][s]);
        }
    }

    /**
     * add and process the constraints
     *     input_i * 0 = 0
     * to ensure soundness of input consistency
     */
    for (let i = 0; i < circuit.nPubInputs + circuit.nOutputs + 1; ++i)
    {
        setup.vk_proof.polsA[i][circuit.nConstraints + i] = F.one;
    }
}

function calculateValuesAtT(setup, circuit) {
    const z_t = PolF.computeVanishingPolinomial(setup.vk_proof.domainBits, setup.toxic.t);
    const u = PolF.evaluateLagrangePolynomials(setup.vk_proof.domainBits, setup.toxic.t);

    const a_t = new Array(circuit.nVars).fill(F.zero);
    const b_t = new Array(circuit.nVars).fill(F.zero);
    const c_t = new Array(circuit.nVars).fill(F.zero);

    // TODO: substitute setup.polsA for coeficients
    for (let s=0; s<circuit.nVars; s++) {
        for (let c in setup.vk_proof.polsA[s]) {
            a_t[s] = F.add(a_t[s], F.mul(u[c], setup.vk_proof.polsA[s][c]));
        }
        for (let c in setup.vk_proof.polsB[s]) {
            b_t[s] = F.add(b_t[s], F.mul(u[c], setup.vk_proof.polsB[s][c]));
        }
        for (let c in setup.vk_proof.polsC[s]) {
            c_t[s] = F.add(c_t[s], F.mul(u[c], setup.vk_proof.polsC[s][c]));
        }
    }

    return {a_t, b_t, c_t, z_t};

}




function calculateEncriptedValuesAtT(setup, circuit) {

    const v = calculateValuesAtT(setup, circuit);
    setup.vk_proof.A = new Array(circuit.nVars+1);
    setup.vk_proof.B = new Array(circuit.nVars+1);
    setup.vk_proof.C = new Array(circuit.nVars+1);
    setup.vk_proof.Ap = new Array(circuit.nVars+1);
    setup.vk_proof.Bp = new Array(circuit.nVars+1);
    setup.vk_proof.Cp = new Array(circuit.nVars+1);
    setup.vk_proof.Kp = new Array(circuit.nVars+3);
    setup.vk_verifier.IC = new Array(circuit.nPublic);

    setup.toxic.ka = F.random();
    setup.toxic.kb = F.random();
    setup.toxic.kc = F.random();
    setup.toxic.ra = F.random();
    setup.toxic.rb = F.random();
    setup.toxic.rc = F.mul(setup.toxic.ra, setup.toxic.rb);
    setup.toxic.kbeta = F.random();
    setup.toxic.kgamma = F.random();

    const gb = F.mul(setup.toxic.kbeta, setup.toxic.kgamma);

    setup.vk_verifier.vk_a = G2.affine(G2.mulScalar( G2.g, setup.toxic.ka));
    setup.vk_verifier.vk_b = G1.affine(G1.mulScalar( G1.g, setup.toxic.kb));
    setup.vk_verifier.vk_c = G2.affine(G2.mulScalar( G2.g, setup.toxic.kc));
    setup.vk_verifier.vk_gb_1 = G1.affine(G1.mulScalar( G1.g, gb));
    setup.vk_verifier.vk_gb_2 = G2.affine(G2.mulScalar( G2.g, gb));
    setup.vk_verifier.vk_g = G2.affine(G2.mulScalar( G2.g, setup.toxic.kgamma));

    for (let s=0; s<circuit.nVars; s++) {

        // A[i] = G1 * polA(t)
        const raat = F.mul(setup.toxic.ra, v.a_t[s]);
        const A = G1.affine(G1.mulScalar(G1.g, raat));

        setup.vk_proof.A[s] = A;

        if (s <= setup.vk_proof.nPublic) {
            setup.vk_verifier.IC[s]=A;
        }


        // B1[i] = G1 * polB(t)
        const rbbt = F.mul(setup.toxic.rb, v.b_t[s]);
        const B1 = G1.affine(G1.mulScalar(G1.g, rbbt));

        // B2[i] = G2 * polB(t)
        const B2 = G2.affine(G2.mulScalar(G2.g, rbbt));

        setup.vk_proof.B[s]=B2;

        // C[i] = G1 * polC(t)
        const rcct = F.mul(setup.toxic.rc, v.c_t[s]);
        const C = G1.affine(G1.mulScalar( G1.g, rcct));
        setup.vk_proof.C[s] =C;

        // K = G1 * (A+B+C)

        const kt = F.affine(F.add(F.add(raat, rbbt), rcct));
        const K = G1.affine(G1.mulScalar( G1.g, kt));

        /*
        // Comment this lines to improve the process
                const Ktest = G1.affine(G1.add(G1.add(A, B1), C));

                if (!G1.equals(K, Ktest)) {
                    console.log ("=====FAIL======");
                }
        */

        if (s > setup.vk_proof.nPublic) {
            setup.vk_proof.Ap[s] = G1.affine(G1.mulScalar(A, setup.toxic.ka));
        }
        setup.vk_proof.Bp[s] = G1.affine(G1.mulScalar(B1, setup.toxic.kb));
        setup.vk_proof.Cp[s] = G1.affine(G1.mulScalar(C, setup.toxic.kc));
        setup.vk_proof.Kp[s] = G1.affine(G1.mulScalar(K, setup.toxic.kbeta));
    }

    // Extra coeficients
    const A = G1.mulScalar( G1.g, F.mul(setup.toxic.ra, v.z_t));
    setup.vk_proof.A[circuit.nVars] = G1.affine(A);
    setup.vk_proof.Ap[circuit.nVars] = G1.affine(G1.mulScalar(A, setup.toxic.ka));

    const B1 = G1.mulScalar( G1.g, F.mul(setup.toxic.rb, v.z_t));
    const B2 = G2.mulScalar( G2.g, F.mul(setup.toxic.rb, v.z_t));
    setup.vk_proof.B[circuit.nVars] = G2.affine(B2);
    setup.vk_proof.Bp[circuit.nVars] = G1.affine(G1.mulScalar(B1, setup.toxic.kb));

    const C = G1.mulScalar( G1.g, F.mul(setup.toxic.rc, v.z_t));
    setup.vk_proof.C[circuit.nVars] = G1.affine(C);
    setup.vk_proof.Cp[circuit.nVars] = G1.affine(G1.mulScalar(C, setup.toxic.kc));

    setup.vk_proof.Kp[circuit.nVars  ] = G1.affine(G1.mulScalar(A, setup.toxic.kbeta));
    setup.vk_proof.Kp[circuit.nVars+1] = G1.affine(G1.mulScalar(B1, setup.toxic.kbeta));
    setup.vk_proof.Kp[circuit.nVars+2] = G1.affine(G1.mulScalar(C, setup.toxic.kbeta));

//    setup.vk_verifier.A[0] = G1.affine(G1.add(setup.vk_verifier.A[0], setup.vk_proof.A[circuit.nVars]));

    // vk_z
    setup.vk_verifier.vk_z = G2.affine(G2.mulScalar(
        G2.g,
        F.mul(setup.toxic.rc, v.z_t)));
}

function calculateHexps(setup) {

    const maxH = setup.vk_proof.domainSize+1;

    setup.vk_proof.hExps = new Array(maxH);
    setup.vk_proof.hExps[0] = G1.g;
    let eT = setup.toxic.t;
    for (let i=1; i<maxH; i++) {
        setup.vk_proof.hExps[i] = G1.affine(G1.mulScalar(G1.g, eT));
        eT = F.mul(eT, setup.toxic.t);
    }
}


},{"./bigint.js":3,"./bn128.js":4,"./polfield.js":11,"./zqfield.js":19}],16:[function(require,module,exports){
/*
    Copyright 2018 0kims association.

    This file is part of snarkjs.

    snarkjs is a free software: you can redistribute it and/or
    modify it under the terms of the GNU General Public License as published by the
    Free Software Foundation, either version 3 of the License, or (at your option)
    any later version.

    snarkjs is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
    more details.

    You should have received a copy of the GNU General Public License along with
    snarkjs. If not, see <https://www.gnu.org/licenses/>.
*/

const bigInt = require("./bigint.js");

module.exports.stringifyBigInts = stringifyBigInts;
module.exports.unstringifyBigInts = unstringifyBigInts;

function stringifyBigInts(o) {
    if ((typeof(o) == "bigint") || (o instanceof bigInt))  {
        return o.toString(10);
    } else if (Array.isArray(o)) {
        return o.map(stringifyBigInts);
    } else if (typeof o == "object") {
        const res = {};
        for (let k in o) {
            res[k] = stringifyBigInts(o[k]);
        }
        return res;
    } else {
        return o;
    }
}

function unstringifyBigInts(o) {
    if ((typeof(o) == "string") && (/^[0-9]+$/.test(o) ))  {
        return bigInt(o);
    } else if (Array.isArray(o)) {
        return o.map(unstringifyBigInts);
    } else if (typeof o == "object") {
        const res = {};
        for (let k in o) {
            res[k] = unstringifyBigInts(o[k]);
        }
        return res;
    } else {
        return o;
    }
}

},{"./bigint.js":3}],17:[function(require,module,exports){
/*
    Copyright 2018 0kims association.

    This file is part of snarkjs.

    snarkjs is a free software: you can redistribute it and/or
    modify it under the terms of the GNU General Public License as published by the
    Free Software Foundation, either version 3 of the License, or (at your option)
    any later version.

    snarkjs is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
    more details.

    You should have received a copy of the GNU General Public License along with
    snarkjs. If not, see <https://www.gnu.org/licenses/>.
*/

/* Implementation of this paper: https://eprint.iacr.org/2016/260.pdf */


const BN128 = require("./bn128.js");

const bn128 = new BN128();
const G1 = bn128.G1;

module.exports = function isValid(vk_verifier, proof, publicSignals) {

    let cpub = vk_verifier.IC[0];
    for (let s= 0; s< vk_verifier.nPublic; s++) {
        cpub  = G1.add( cpub, G1.mulScalar( vk_verifier.IC[s+1], publicSignals[s]));
    }

    if (! bn128.F12.equals(
        bn128.pairing( proof.pi_a , proof.pi_b ),
        bn128.F12.mul(
            vk_verifier.vk_alfabeta_12,
            bn128.F12.mul(
                bn128.pairing( cpub , vk_verifier.vk_gamma_2 ),
                bn128.pairing( proof.pi_c , vk_verifier.vk_delta_2 )
            ))))
        return false;

    return true;
};

},{"./bn128.js":4}],18:[function(require,module,exports){
/*
    Copyright 2018 0kims association.

    This file is part of snarkjs.

    snarkjs is a free software: you can redistribute it and/or
    modify it under the terms of the GNU General Public License as published by the
    Free Software Foundation, either version 3 of the License, or (at your option)
    any later version.

    snarkjs is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
    more details.

    You should have received a copy of the GNU General Public License along with
    snarkjs. If not, see <https://www.gnu.org/licenses/>.
*/

const BN128 = require("./bn128.js");

const bn128 = new BN128();
const G1 = bn128.G1;
const G2 = bn128.G2;

module.exports = function isValid(vk_verifier, proof, publicSignals) {

    let full_pi_a = vk_verifier.IC[0];
    for (let s= 0; s< vk_verifier.nPublic; s++) {
        full_pi_a  = G1.add( full_pi_a, G1.mulScalar( vk_verifier.IC[s+1], publicSignals[s]));
    }

    full_pi_a  = G1.add( full_pi_a, proof.pi_a);

    if (! bn128.F12.equals(
        bn128.pairing( proof.pi_a , vk_verifier.vk_a ),
        bn128.pairing( proof.pi_ap , G2.g )))
        return false;

    if (! bn128.F12.equals(
        bn128.pairing( vk_verifier.vk_b,  proof.pi_b ),
        bn128.pairing( proof.pi_bp , G2.g )))
        return false;

    if (! bn128.F12.equals(
        bn128.pairing( proof.pi_c , vk_verifier.vk_c ),
        bn128.pairing( proof.pi_cp , G2.g )))
        return false;

    if (! bn128.F12.equals(
        bn128.F12.mul(
            bn128.pairing( G1.add(full_pi_a, proof.pi_c) , vk_verifier.vk_gb_2 ),
            bn128.pairing( vk_verifier.vk_gb_1 , proof.pi_b )
        ),
        bn128.pairing( proof.pi_kp , vk_verifier.vk_g )))
        return false;

    if (! bn128.F12.equals(
        bn128.pairing( full_pi_a , proof.pi_b  ),
        bn128.F12.mul(
            bn128.pairing( proof.pi_h , vk_verifier.vk_z ),
            bn128.pairing( proof.pi_c , G2.g  )
        )))
        return false;

    return true;
};

},{"./bn128.js":4}],19:[function(require,module,exports){
/*
    Copyright 2018 0kims association.

    This file is part of snarkjs.

    snarkjs is a free software: you can redistribute it and/or
    modify it under the terms of the GNU General Public License as published by the
    Free Software Foundation, either version 3 of the License, or (at your option)
    any later version.

    snarkjs is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
    more details.

    You should have received a copy of the GNU General Public License along with
    snarkjs. If not, see <https://www.gnu.org/licenses/>.
*/

const bigInt = require("./bigint");
const fUtils = require("./futils.js");

function getRandomByte() {
    if (typeof window !== "undefined") { // Browser
        if (typeof window.crypto !== "undefined") { // Supported
            let array = new Uint8Array(1);
            window.crypto.getRandomValues(array);
            return array[0];
        }
        else { // fallback
            return Math.floor(Math.random() * 256);
        }
    }
    else { // NodeJS
        return module.require("crypto").randomBytes(1)[0];
    }
}

class ZqField {
    constructor(q) {
        this.q = bigInt(q);
        this.zero = bigInt.zero;
        this.one = bigInt.one;
        this.minusone = this.q.sub(this.one);
        this.add = bigInt.genAdd();
        this.double = bigInt.genDouble();
        this.sub = bigInt.genSub();
        this.neg = bigInt.genNeg();
        this.mul = bigInt.genMul(q);
        this.inverse = bigInt.genInverse(q);
        this.square = bigInt.genSquare(q);
        this.equals = bigInt.genEquals(q);
        this.affine = bigInt.genAffine(q);
        this.isZero = bigInt.genIsZero(q);
        this.two = this.add(this.one, this.one);
        this.twoinv = this.inverse(this.two);

        const e = this.minusone.shr(this.one);
        this.nqr = this.two;
        let r = this.exp(this.nqr, e);
        while (!r.equals(this.minusone)) {
            this.nqr = this.nqr.add(this.one);
            r = this.exp(this.nqr, e);
        }

        this.s = this.zero;
        this.t = this.minusone;

        while (!this.t.isOdd()) {
            this.s = this.s.add(this.one);
            this.t = this.t.shr(this.one);
        }

        this.nqr_to_t = this.exp(this.nqr, this.t);
    }

    copy(a) {
        return bigInt(a);
    }

    div(a, b) {
        return this.mul(a, this.inverse(b));
    }

    mulScalar(base, e) {
        return this.mul(base, bigInt(e));
    }

    exp(base, e) {
        return fUtils.exp(this, base, e);
    }

    toString(a) {
        const ca = this.affine(a);
        return `"0x${ca.toString(16)}"`;
    }

    random() {
        let res = bigInt(0);
        let n = bigInt(this.q);
        while (!n.isZero()) {
            res = res.shl(8).add(bigInt(getRandomByte()));
            n = n.shr(8);
        }
        return res;
    }

    sqrt(n) {

        n = this.affine(n);

        if (n.equals(this.zero)) return this.zero;

        // Test that have solution
        const res = this.exp(n, this.minusone.shr(this.one));
        if (!res.equals(this.one)) return null;

        let m = parseInt(this.s);
        let c = this.nqr_to_t;
        let t = this.exp(n, this.t);
        let r = this.exp(n, this.add(this.t, this.one).shr(this.one) );

        while (!t.equals(this.one)) {
            let sq = this.square(t);
            let i = 1;
            while (!sq.equals(this.one)) {
                i++;
                sq = this.square(sq);
            }

            // b = c ^ m-i-1
            let b = c;
            for (let j=0; j< m-i-1; j ++) b = this.square(b);

            m = i;
            c = this.square(b);
            t = this.mul(t, c);
            r = this.mul(r, b);
        }

        if (r.greater(this.q.shr(this.one))) {
            r = this.neg(r);
        }

        return r;
    }

}


module.exports = ZqField;

},{"./bigint":3,"./futils.js":9}],20:[function(require,module,exports){

const assert = require("assert");


function writeUint32(h, val) {
    h.dataView.setUint32(h.offset, val, true);
    h.offset += 4;
}

function writeUint32ToPointer(h, p, val) {
    h.dataView.setUint32(p, val, true);
}


function alloc(h, n) {
    const o = h.offset;
    h.offset += n;
    return o;
}

function writeBigInt(h, bi) {
    for (let i=0; i<8; i++) {
        const v = Number((bi >> (BigInt(i)*32n)) & 0xFFFFFFFFn);
        writeUint32(h, v);
    }
}

function toMontgomeryQ(p) {
    const q = 21888242871839275222246405745257275088696311157297823662689037894645226208583n;
    return p * (1n << 256n) % q;
}

function toMontgomeryR(p) {
    const r = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
    return p * (1n << 256n) % r;
}

function writePoint(h, p) {
    writeBigInt(h, toMontgomeryQ(p[0]));
    writeBigInt(h, toMontgomeryQ(p[1]));
}

function writePoint2(h, p) {
    writeBigInt(h, toMontgomeryQ(p[0][0]));
    writeBigInt(h, toMontgomeryQ(p[0][1]));
    writeBigInt(h, toMontgomeryQ(p[1][0]));
    writeBigInt(h, toMontgomeryQ(p[1][1]));
}

function writeTransformedPolynomial(h, p) {

    const keys = Object.keys(p);

    writeUint32(h, keys.length);

    for (let i=0; i<keys.length; i++) {
        writeUint32(h, keys[i]);
        writeBigInt(h, toMontgomeryR(p[keys[i]]));
    }
}

function calculateBuffLen(provingKey) {
    function polSize(pol) {
        const l= Object.keys(pol).length;
        return 36*l + 4;
    }

    let size = 40;

    // alfa1, beta1, delta1
    size += 3 * (32*2);

    // beta2, delta2
    size += 2 * (32*4);

    for (let i=0; i<provingKey.nVars; i++) {
        size += polSize(provingKey.polsA[i]);
        size += polSize(provingKey.polsB[i]);
    }

    size += provingKey.nVars* (32*2);
    size += provingKey.nVars* (32*2);
    size += provingKey.nVars* (32*4);
    size += (provingKey.nVars - provingKey.nPublic  - 1)* (32*2);
    size += provingKey.domainSize * (32*2);

    return size;
}


module.exports = (provingKey) => {

  const buffLen = calculateBuffLen(provingKey);

  const buff = new ArrayBuffer(buffLen);

  const h = {
      dataView: new DataView(buff),
      offset: 0
  };


  writeUint32(h, provingKey.nVars);
  writeUint32(h, provingKey.nPublic);
  writeUint32(h, provingKey.domainSize);
  const pPolsA = alloc(h, 4);
  const pPolsB = alloc(h, 4);
  const pPointsA = alloc(h, 4);
  const pPointsB1 = alloc(h, 4);
  const pPointsB2 = alloc(h, 4);
  const pPointsC = alloc(h, 4);
  const pPointsHExps = alloc(h, 4);

  writePoint(h, provingKey.vk_alfa_1);
  writePoint(h, provingKey.vk_beta_1);
  writePoint(h, provingKey.vk_delta_1);
  writePoint2(h, provingKey.vk_beta_2);
  writePoint2(h, provingKey.vk_delta_2);

  writeUint32ToPointer(h, pPolsA, h.offset);
  for (let i=0; i<provingKey.nVars; i++) {
      writeTransformedPolynomial(h, provingKey.polsA[i]);
  }

  writeUint32ToPointer(h, pPolsB, h.offset);
  for (let i=0; i<provingKey.nVars; i++) {
      writeTransformedPolynomial(h, provingKey.polsB[i]);
  }

  writeUint32ToPointer(h, pPointsA, h.offset);
  for (let i=0; i<provingKey.nVars; i++) {
      writePoint(h, provingKey.A[i]);
  }

  writeUint32ToPointer(h, pPointsB1, h.offset);
  for (let i=0; i<provingKey.nVars; i++) {
      writePoint(h, provingKey.B1[i]);
  }

  writeUint32ToPointer(h, pPointsB2, h.offset);
  for (let i=0; i<provingKey.nVars; i++) {
      writePoint2(h, provingKey.B2[i]);
  }

  writeUint32ToPointer(h, pPointsC, h.offset);
  for (let i=provingKey.nPublic+1; i<provingKey.nVars; i++) {
      writePoint(h, provingKey.C[i]);
  }

  writeUint32ToPointer(h, pPointsHExps, h.offset);
  for (let i=0; i<provingKey.domainSize; i++) {
      writePoint(h, provingKey.hExps[i]);
  }

  assert.equal(h.offset, buffLen);

  return buff;
}
},{"assert":23}],21:[function(require,module,exports){
const assert = require("assert");




function writeUint32(h, val) {
    h.dataView.setUint32(h.offset, val, true);
    h.offset += 4;
}


function writeBigInt(h, bi) {
  for (let i=0; i<8; i++) {
      const v = Number((bi >> (BigInt(i)*32n)) & 0xFFFFFFFFn);
      writeUint32(h, v);
  }
}


function calculateBuffLen(witness) {

    let size = 0;

    // beta2, delta2
    size += witness.length * 32;

    return size;
}

module.exports=(witness)=>{

  const buffLen = calculateBuffLen(witness);

  const buff = new ArrayBuffer(buffLen);

  const h = {
      dataView: new DataView(buff),
      offset: 0
  };


  // writeUint32(h, witness.length);

  for (let i=0; i<witness.length; i++) {
      writeBigInt(h, witness[i]);
  }

  assert.equal(h.offset, buffLen);

  return buff;

}
},{"assert":23}],22:[function(require,module,exports){
const snarkjs = require("snarkjs");
const { Circuit } = snarkjs;

const { unstringifyBigInts } = require("snarkjs/src/stringifybigint");

const buildpkey = require("./buildpkey.js");
const buildwitness = require("./buildwitness.js");

module.exports = async ({
                            transaction,
                            transaction_pk,
                            buildGroth16,
                            input}) => {
  if (typeof (wasmgroth) === "undefined") {
    wasmgroth = await buildGroth16();
  }

  const circuit = new Circuit(transaction);
  const witness = circuit.calculateWitness(input);
  const proof = unstringifyBigInts(await wasmgroth.proof(buildwitness(witness), buildpkey(transaction_pk)));
  proof.protocol = "groth";

  return { proof, publicSignals: witness.slice(1, circuit.nPubInputs + circuit.nOutputs + 1) };
};
},{"./buildpkey.js":20,"./buildwitness.js":21,"snarkjs":2,"snarkjs/src/stringifybigint":16}],23:[function(require,module,exports){
(function (global){
'use strict';

// compare and isBuffer taken from https://github.com/feross/buffer/blob/680e9e5e488f22aac27599a57dc844a6315928dd/index.js
// original notice:

/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
function compare(a, b) {
  if (a === b) {
    return 0;
  }

  var x = a.length;
  var y = b.length;

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i];
      y = b[i];
      break;
    }
  }

  if (x < y) {
    return -1;
  }
  if (y < x) {
    return 1;
  }
  return 0;
}
function isBuffer(b) {
  if (global.Buffer && typeof global.Buffer.isBuffer === 'function') {
    return global.Buffer.isBuffer(b);
  }
  return !!(b != null && b._isBuffer);
}

// based on node assert, original notice:

// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

var util = require('util/');
var hasOwn = Object.prototype.hasOwnProperty;
var pSlice = Array.prototype.slice;
var functionsHaveNames = (function () {
  return function foo() {}.name === 'foo';
}());
function pToString (obj) {
  return Object.prototype.toString.call(obj);
}
function isView(arrbuf) {
  if (isBuffer(arrbuf)) {
    return false;
  }
  if (typeof global.ArrayBuffer !== 'function') {
    return false;
  }
  if (typeof ArrayBuffer.isView === 'function') {
    return ArrayBuffer.isView(arrbuf);
  }
  if (!arrbuf) {
    return false;
  }
  if (arrbuf instanceof DataView) {
    return true;
  }
  if (arrbuf.buffer && arrbuf.buffer instanceof ArrayBuffer) {
    return true;
  }
  return false;
}
// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

var regex = /\s*function\s+([^\(\s]*)\s*/;
// based on https://github.com/ljharb/function.prototype.name/blob/adeeeec8bfcc6068b187d7d9fb3d5bb1d3a30899/implementation.js
function getName(func) {
  if (!util.isFunction(func)) {
    return;
  }
  if (functionsHaveNames) {
    return func.name;
  }
  var str = func.toString();
  var match = str.match(regex);
  return match && match[1];
}
assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  } else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = getName(stackStartFunction);
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function truncate(s, n) {
  if (typeof s === 'string') {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}
function inspect(something) {
  if (functionsHaveNames || !util.isFunction(something)) {
    return util.inspect(something);
  }
  var rawname = getName(something);
  var name = rawname ? ': ' + rawname : '';
  return '[Function' +  name + ']';
}
function getMessage(self) {
  return truncate(inspect(self.actual), 128) + ' ' +
         self.operator + ' ' +
         truncate(inspect(self.expected), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

assert.deepStrictEqual = function deepStrictEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'deepStrictEqual', assert.deepStrictEqual);
  }
};

function _deepEqual(actual, expected, strict, memos) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;
  } else if (isBuffer(actual) && isBuffer(expected)) {
    return compare(actual, expected) === 0;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if ((actual === null || typeof actual !== 'object') &&
             (expected === null || typeof expected !== 'object')) {
    return strict ? actual === expected : actual == expected;

  // If both values are instances of typed arrays, wrap their underlying
  // ArrayBuffers in a Buffer each to increase performance
  // This optimization requires the arrays to have the same type as checked by
  // Object.prototype.toString (aka pToString). Never perform binary
  // comparisons for Float*Arrays, though, since e.g. +0 === -0 but their
  // bit patterns are not identical.
  } else if (isView(actual) && isView(expected) &&
             pToString(actual) === pToString(expected) &&
             !(actual instanceof Float32Array ||
               actual instanceof Float64Array)) {
    return compare(new Uint8Array(actual.buffer),
                   new Uint8Array(expected.buffer)) === 0;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else if (isBuffer(actual) !== isBuffer(expected)) {
    return false;
  } else {
    memos = memos || {actual: [], expected: []};

    var actualIndex = memos.actual.indexOf(actual);
    if (actualIndex !== -1) {
      if (actualIndex === memos.expected.indexOf(expected)) {
        return true;
      }
    }

    memos.actual.push(actual);
    memos.expected.push(expected);

    return objEquiv(actual, expected, strict, memos);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b, strict, actualVisitedObjects) {
  if (a === null || a === undefined || b === null || b === undefined)
    return false;
  // if one is a primitive, the other must be same
  if (util.isPrimitive(a) || util.isPrimitive(b))
    return a === b;
  if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b))
    return false;
  var aIsArgs = isArguments(a);
  var bIsArgs = isArguments(b);
  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
    return false;
  if (aIsArgs) {
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b, strict);
  }
  var ka = objectKeys(a);
  var kb = objectKeys(b);
  var key, i;
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length !== kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] !== kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key], strict, actualVisitedObjects))
      return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

assert.notDeepStrictEqual = notDeepStrictEqual;
function notDeepStrictEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'notDeepStrictEqual', notDeepStrictEqual);
  }
}


// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  }

  try {
    if (actual instanceof expected) {
      return true;
    }
  } catch (e) {
    // Ignore.  The instanceof check doesn't work for arrow functions.
  }

  if (Error.isPrototypeOf(expected)) {
    return false;
  }

  return expected.call({}, actual) === true;
}

function _tryBlock(block) {
  var error;
  try {
    block();
  } catch (e) {
    error = e;
  }
  return error;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (typeof block !== 'function') {
    throw new TypeError('"block" argument must be a function');
  }

  if (typeof expected === 'string') {
    message = expected;
    expected = null;
  }

  actual = _tryBlock(block);

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  var userProvidedMessage = typeof message === 'string';
  var isUnwantedException = !shouldThrow && util.isError(actual);
  var isUnexpectedException = !shouldThrow && actual && !expected;

  if ((isUnwantedException &&
      userProvidedMessage &&
      expectedException(actual, expected)) ||
      isUnexpectedException) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws(true, block, error, message);
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/error, /*optional*/message) {
  _throws(false, block, error, message);
};

assert.ifError = function(err) { if (err) throw err; };

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"util/":26}],24:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],25:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],26:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":25,"_process":30,"inherits":24}],27:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  for (var i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],28:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

},{"base64-js":27,"ieee754":29}],29:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],30:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[22])(22)
});
