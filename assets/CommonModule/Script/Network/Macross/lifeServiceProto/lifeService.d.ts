/* eslint-disable @typescript-eslint/no-unused-vars */
import * as $protobuf from 'protobufjs';
/** Namespace lifeServiceProto. */
export namespace lifeServiceProto {
  /** Properties of a LifeServiceInitInfo. */
  interface ILifeServiceInitInfo {
    /** LifeServiceInitInfo userID */
    userID?: string | null;

    /** LifeServiceInitInfo accountID */
    accountID?: number | Long | null;

    /** LifeServiceInitInfo gameID */
    gameID?: number | null;

    /** LifeServiceInitInfo token */
    token?: string | null;

    /** LifeServiceInitInfo route */
    route?: number | null;

    /** LifeServiceInitInfo apiID */
    apiID?: number | null;
  }

  /** Represents a LifeServiceInitInfo. */
  class LifeServiceInitInfo implements ILifeServiceInitInfo {
    /**
     * Constructs a new LifeServiceInitInfo.
     * @param [properties] Properties to set
     */
    constructor(properties?: lifeServiceProto.ILifeServiceInitInfo);

    /** LifeServiceInitInfo userID. */
    public userID: string;

    /** LifeServiceInitInfo accountID. */
    public accountID: number | Long;

    /** LifeServiceInitInfo gameID. */
    public gameID: number;

    /** LifeServiceInitInfo token. */
    public token: string;

    /** LifeServiceInitInfo route. */
    public route: number;

    /** LifeServiceInitInfo apiID. */
    public apiID: number;

    /**
     * Creates a new LifeServiceInitInfo instance using the specified properties.
     * @param [properties] Properties to set
     * @returns LifeServiceInitInfo instance
     */
    public static create(
      properties?: lifeServiceProto.ILifeServiceInitInfo
    ): lifeServiceProto.LifeServiceInitInfo;

    /**
     * Encodes the specified LifeServiceInitInfo message. Does not implicitly {@link lifeServiceProto.LifeServiceInitInfo.verify|verify} messages.
     * @param message LifeServiceInitInfo message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: lifeServiceProto.ILifeServiceInitInfo,
      writer?: $protobuf.Writer
    ): $protobuf.Writer;

    /**
     * Encodes the specified LifeServiceInitInfo message, length delimited. Does not implicitly {@link lifeServiceProto.LifeServiceInitInfo.verify|verify} messages.
     * @param message LifeServiceInitInfo message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(
      message: lifeServiceProto.ILifeServiceInitInfo,
      writer?: $protobuf.Writer
    ): $protobuf.Writer;

    /**
     * Decodes a LifeServiceInitInfo message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns LifeServiceInitInfo
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number
    ): lifeServiceProto.LifeServiceInitInfo;

    /**
     * Decodes a LifeServiceInitInfo message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns LifeServiceInitInfo
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(
      reader: $protobuf.Reader | Uint8Array
    ): lifeServiceProto.LifeServiceInitInfo;

    /**
     * Verifies a LifeServiceInitInfo message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: {[k: string]: any}): string | null;

    /**
     * Creates a LifeServiceInitInfo message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns LifeServiceInitInfo
     */
    public static fromObject(object: {
      [k: string]: any;
    }): lifeServiceProto.LifeServiceInitInfo;

    /**
     * Creates a plain object from a LifeServiceInitInfo message. Also converts values to other types if specified.
     * @param message LifeServiceInitInfo
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: lifeServiceProto.LifeServiceInitInfo,
      options?: $protobuf.IConversionOptions
    ): {[k: string]: any};

    /**
     * Converts this LifeServiceInitInfo to JSON.
     * @returns JSON object
     */
    public toJSON(): {[k: string]: any};
  }
}
