import { Socket } from "net"

export class Bytestream {
    public buffer: Buffer
    public version: number
    public id: number
    public length: number // used when decoding packet
    public bitOffset: number

    constructor(data: Buffer | void, version: number, id: number) {
        this.buffer = data || Buffer.alloc(0)
        this.version = version
        this.id = id
        this.length = 0
        this.bitOffset = 0
    }

    // reading string from bytes
    public readString(): string {
        let lengthString: number = this.buffer.readUint32BE()
        this.buffer = this.buffer.slice(4)
        if (lengthString < 0) {
            return ""
        }
        let string: string = this.buffer.toString("utf-8", 0, lengthString)
        this.buffer = this.buffer.slice(lengthString)

        return string
    }

    // writing string length + string to bytes
    public writeString(text?: string | undefined): void {
        if (text == null) {
            this.writeInt(-1)
        } else {
            let lengthBuffer = Buffer.alloc(4)
            lengthBuffer.writeUInt32BE(text.length)
            let textBuffer = Buffer.from(text, "utf-8")
            let LenandTextBuffer = Buffer.concat([lengthBuffer, textBuffer])
            this.buffer = Buffer.concat([this.buffer, LenandTextBuffer])
        }

    }

    // writing number to bytes as 32 bit number
    public writeInt(int: number): void {
        let intBuffer = Buffer.alloc(4)
        try {
            intBuffer.writeInt32BE(int)
        } catch (error) {
            intBuffer.writeInt32BE(0)
            console.log(`failed to writeInt. error: \n${error}`)
        }
        this.buffer = Buffer.concat([this.buffer, intBuffer])
    }

    // reading number from bytes as 32 bit number
    public readInt(): number {
        if (this.buffer.length < 4) {
            return 0
        }
        let number = this.buffer.readUInt32BE()
        this.buffer = this.buffer.slice(4)

        return number
    }

    // writing number to bytes as 16 bit number
    public writeShort(int: number): void {
        let shortBuffer = Buffer.alloc(2)
        shortBuffer.writeInt16BE(int)
        this.buffer = Buffer.concat([this.buffer, shortBuffer])
    }

    // reading 16 bit number from bytes
    public readShort(): number {
        let number = this.buffer.readInt16BE()
        this.buffer = this.buffer.slice(2)
        return number
    }

    public writeBoolean(value: boolean): void {
        let buffer = Buffer.alloc(1)
        if (value) { buffer.writeUInt8(1) } else { buffer.writeUint8(0) }
        this.buffer = Buffer.concat([this.buffer, buffer])
    }

    public readBoolean(): boolean {
        let number = this.buffer.readInt8()
        this.buffer = this.buffer.slice(1)
        return number === 1
    }

    public writeLong(v1: number, v2: number): void {
        let buffer = Buffer.alloc(8)
        buffer.writeUInt32BE(v1)
        buffer.writeUInt32BE(v2)
        this.buffer = Buffer.concat([this.buffer, buffer])
    }

    public readLong(): number[] {
        const v1 = this.buffer.readInt32BE()
        this.buffer = this.buffer.slice(4)
        const v2 = this.buffer.readInt32BE()
        this.buffer = this.buffer.slice(4)
        return [v1, v2]
    }

    public writeByte(byte: number): void {
        const newBuffer = Buffer.alloc(1)
        newBuffer.writeUInt8(byte, 0)
        this.buffer = Buffer.concat([this.buffer, newBuffer])
    }

    // from nodebrawl-core
    public writeVInt(value: number): number {
        this.bitOffset = 0
        let temp: number = (value >> 25) & 0x40

        let flipped: number = value ^ (value >> 31)

        temp |= value & 0x3F

        value >>= 6
        flipped >>= 6

        if (flipped === 0) {
            this.writeByte(temp)
            return 0
        }

        this.writeByte(temp | 0x80)

        flipped >>= 7
        let r: number = 0

        if (flipped) { r = 0x80 }

        this.writeByte((value & 0x7F) | r)

        value >>= 7

        while (flipped !== 0) {
            flipped >>= 7
            r = 0
            if (flipped) { r = 0x80 }
            this.writeByte((value & 0x7F) | r)
            value >>= 7
        }
        return 0
    }

    // from nodebrawl-core
    public readVInt(): number {
        let result = 0
        let shift = 0
        let s = 0
        let a1 = 0
        let a2 = 0

        while (true) {
            let byte = this.buffer[0]
            this.buffer = this.buffer.slice(1)

            if (shift == 0) {
                a1 = (byte & 0x40) >> 6
                a2 = (byte & 0x80) >> 7
                s = (byte << 1) & ~0x181
                byte = s | (a2 << 7) | a1
            }

            result |= (byte & 0x7F) << shift
            shift += 7

            if ((byte & 0x80) === 0) {
                break
            }
        }

        return (result >> 1) ^ (-(result & 1))
    }

    public writeDataReference(v1: number, v2: number): void {
        if (v1 != 0) {
            this.writeVInt(v1)
            this.writeVInt(v2)
        } else {
            this.writeVInt(0)
        }
    }

    public readDataReference(): number[] {
        return [this.readVInt(), this.readVInt()]
    }

    public size(): number {
        return this.buffer.length
    }

    public decode(): void {
        this.id = this.readShort()
        this.length = this.buffer.readUintBE(0, 3)
        this.buffer = this.buffer.slice(3)
        this.version = this.readShort()
        //this.buffer = this.buffer.slice(0, this.length) who cares

        console.log(this.buffer)
    }

    public send(socket: Socket): void {
        const headerBuffer = Buffer.alloc(7)
        headerBuffer.writeUInt16BE(this.id)
        headerBuffer.writeUIntBE(this.buffer.length, 2, 3)
        headerBuffer.writeUInt16BE(this.version, 5)
        this.buffer = Buffer.concat([headerBuffer, this.buffer, Buffer.from([0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0x00])])
        socket.write(this.buffer)
    }
}
