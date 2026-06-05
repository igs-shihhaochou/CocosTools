/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
'use strict';

var $protobuf = require('protobufjs/minimal');

// Common aliases
var $Reader = $protobuf.Reader,
  $Writer = $protobuf.Writer,
  $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots['default'] || ($protobuf.roots['default'] = {});

$root.lifeServiceProto = (function () {
  /**
   * Namespace lifeServiceProto.
   * @exports lifeServiceProto
   * @namespace
   */
  var lifeServiceProto = {};

  lifeServiceProto.LifeServiceInitInfo = (function () {
    /**
     * Properties of a LifeServiceInitInfo.
     * @memberof lifeServiceProto
     * @interface ILifeServiceInitInfo
     * @property {string|null} [userID] LifeServiceInitInfo userID
     * @property {number|Long|null} [accountID] LifeServiceInitInfo accountID
     * @property {number|null} [gameID] LifeServiceInitInfo gameID
     * @property {string|null} [token] LifeServiceInitInfo token
     * @property {number|null} [route] LifeServiceInitInfo route
     * @property {number|null} [apiID] LifeServiceInitInfo apiID
     */

    /**
     * Constructs a new LifeServiceInitInfo.
     * @memberof lifeServiceProto
     * @classdesc Represents a LifeServiceInitInfo.
     * @implements ILifeServiceInitInfo
     * @constructor
     * @param {lifeServiceProto.ILifeServiceInitInfo=} [properties] Properties to set
     */
    function LifeServiceInitInfo(properties) {
      if (properties)
        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * LifeServiceInitInfo userID.
     * @member {string} userID
     * @memberof lifeServiceProto.LifeServiceInitInfo
     * @instance
     */
    LifeServiceInitInfo.prototype.userID = '';

    /**
     * LifeServiceInitInfo accountID.
     * @member {number|Long} accountID
     * @memberof lifeServiceProto.LifeServiceInitInfo
     * @instance
     */
    LifeServiceInitInfo.prototype.accountID = $util.Long
      ? $util.Long.fromBits(0, 0, false)
      : 0;

    /**
     * LifeServiceInitInfo gameID.
     * @member {number} gameID
     * @memberof lifeServiceProto.LifeServiceInitInfo
     * @instance
     */
    LifeServiceInitInfo.prototype.gameID = 0;

    /**
     * LifeServiceInitInfo token.
     * @member {string} token
     * @memberof lifeServiceProto.LifeServiceInitInfo
     * @instance
     */
    LifeServiceInitInfo.prototype.token = '';

    /**
     * LifeServiceInitInfo route.
     * @member {number} route
     * @memberof lifeServiceProto.LifeServiceInitInfo
     * @instance
     */
    LifeServiceInitInfo.prototype.route = 0;

    /**
     * LifeServiceInitInfo apiID.
     * @member {number} apiID
     * @memberof lifeServiceProto.LifeServiceInitInfo
     * @instance
     */
    LifeServiceInitInfo.prototype.apiID = 0;

    /**
     * Creates a new LifeServiceInitInfo instance using the specified properties.
     * @function create
     * @memberof lifeServiceProto.LifeServiceInitInfo
     * @static
     * @param {lifeServiceProto.ILifeServiceInitInfo=} [properties] Properties to set
     * @returns {lifeServiceProto.LifeServiceInitInfo} LifeServiceInitInfo instance
     */
    LifeServiceInitInfo.create = function create(properties) {
      return new LifeServiceInitInfo(properties);
    };

    /**
     * Encodes the specified LifeServiceInitInfo message. Does not implicitly {@link lifeServiceProto.LifeServiceInitInfo.verify|verify} messages.
     * @function encode
     * @memberof lifeServiceProto.LifeServiceInitInfo
     * @static
     * @param {lifeServiceProto.ILifeServiceInitInfo} message LifeServiceInitInfo message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    LifeServiceInitInfo.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (
        message.userID != null &&
        Object.hasOwnProperty.call(message, 'userID')
      )
        writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.userID);
      if (
        message.accountID != null &&
        Object.hasOwnProperty.call(message, 'accountID')
      )
        writer.uint32(/* id 2, wireType 0 =*/ 16).int64(message.accountID);
      if (
        message.gameID != null &&
        Object.hasOwnProperty.call(message, 'gameID')
      )
        writer.uint32(/* id 3, wireType 0 =*/ 24).int32(message.gameID);
      if (message.token != null && Object.hasOwnProperty.call(message, 'token'))
        writer.uint32(/* id 4, wireType 2 =*/ 34).string(message.token);
      if (message.route != null && Object.hasOwnProperty.call(message, 'route'))
        writer.uint32(/* id 5, wireType 0 =*/ 40).int32(message.route);
      if (message.apiID != null && Object.hasOwnProperty.call(message, 'apiID'))
        writer.uint32(/* id 6, wireType 0 =*/ 48).int32(message.apiID);
      return writer;
    };

    /**
     * Encodes the specified LifeServiceInitInfo message, length delimited. Does not implicitly {@link lifeServiceProto.LifeServiceInitInfo.verify|verify} messages.
     * @function encodeDelimited
     * @memberof lifeServiceProto.LifeServiceInitInfo
     * @static
     * @param {lifeServiceProto.ILifeServiceInitInfo} message LifeServiceInitInfo message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    LifeServiceInitInfo.encodeDelimited = function encodeDelimited(
      message,
      writer
    ) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a LifeServiceInitInfo message from the specified reader or buffer.
     * @function decode
     * @memberof lifeServiceProto.LifeServiceInitInfo
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {lifeServiceProto.LifeServiceInitInfo} LifeServiceInitInfo
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    LifeServiceInitInfo.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      var end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.lifeServiceProto.LifeServiceInitInfo();
      while (reader.pos < end) {
        var tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.userID = reader.string();
            break;
          case 2:
            message.accountID = reader.int64();
            break;
          case 3:
            message.gameID = reader.int32();
            break;
          case 4:
            message.token = reader.string();
            break;
          case 5:
            message.route = reader.int32();
            break;
          case 6:
            message.apiID = reader.int32();
            break;
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a LifeServiceInitInfo message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof lifeServiceProto.LifeServiceInitInfo
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {lifeServiceProto.LifeServiceInitInfo} LifeServiceInitInfo
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    LifeServiceInitInfo.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a LifeServiceInitInfo message.
     * @function verify
     * @memberof lifeServiceProto.LifeServiceInitInfo
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    LifeServiceInitInfo.verify = function verify(message) {
      if (typeof message !== 'object' || message === null)
        return 'object expected';
      if (message.userID != null && message.hasOwnProperty('userID'))
        if (!$util.isString(message.userID)) return 'userID: string expected';
      if (message.accountID != null && message.hasOwnProperty('accountID'))
        if (
          !$util.isInteger(message.accountID) &&
          !(
            message.accountID &&
            $util.isInteger(message.accountID.low) &&
            $util.isInteger(message.accountID.high)
          )
        )
          return 'accountID: integer|Long expected';
      if (message.gameID != null && message.hasOwnProperty('gameID'))
        if (!$util.isInteger(message.gameID)) return 'gameID: integer expected';
      if (message.token != null && message.hasOwnProperty('token'))
        if (!$util.isString(message.token)) return 'token: string expected';
      if (message.route != null && message.hasOwnProperty('route'))
        if (!$util.isInteger(message.route)) return 'route: integer expected';
      if (message.apiID != null && message.hasOwnProperty('apiID'))
        if (!$util.isInteger(message.apiID)) return 'apiID: integer expected';
      return null;
    };

    /**
     * Creates a LifeServiceInitInfo message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof lifeServiceProto.LifeServiceInitInfo
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {lifeServiceProto.LifeServiceInitInfo} LifeServiceInitInfo
     */
    LifeServiceInitInfo.fromObject = function fromObject(object) {
      if (object instanceof $root.lifeServiceProto.LifeServiceInitInfo)
        return object;
      var message = new $root.lifeServiceProto.LifeServiceInitInfo();
      if (object.userID != null) message.userID = String(object.userID);
      if (object.accountID != null)
        if ($util.Long)
          (message.accountID = $util.Long.fromValue(
            object.accountID
          )).unsigned = false;
        else if (typeof object.accountID === 'string')
          message.accountID = parseInt(object.accountID, 10);
        else if (typeof object.accountID === 'number')
          message.accountID = object.accountID;
        else if (typeof object.accountID === 'object')
          message.accountID = new $util.LongBits(
            object.accountID.low >>> 0,
            object.accountID.high >>> 0
          ).toNumber();
      if (object.gameID != null) message.gameID = object.gameID | 0;
      if (object.token != null) message.token = String(object.token);
      if (object.route != null) message.route = object.route | 0;
      if (object.apiID != null) message.apiID = object.apiID | 0;
      return message;
    };

    /**
     * Creates a plain object from a LifeServiceInitInfo message. Also converts values to other types if specified.
     * @function toObject
     * @memberof lifeServiceProto.LifeServiceInitInfo
     * @static
     * @param {lifeServiceProto.LifeServiceInitInfo} message LifeServiceInitInfo
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    LifeServiceInitInfo.toObject = function toObject(message, options) {
      if (!options) options = {};
      var object = {};
      if (options.defaults) {
        object.userID = '';
        if ($util.Long) {
          var long = new $util.Long(0, 0, false);
          object.accountID =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.accountID = options.longs === String ? '0' : 0;
        object.gameID = 0;
        object.token = '';
        object.route = 0;
        object.apiID = 0;
      }
      if (message.userID != null && message.hasOwnProperty('userID'))
        object.userID = message.userID;
      if (message.accountID != null && message.hasOwnProperty('accountID'))
        if (typeof message.accountID === 'number')
          object.accountID =
            options.longs === String
              ? String(message.accountID)
              : message.accountID;
        else
          object.accountID =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.accountID)
              : options.longs === Number
                ? new $util.LongBits(
                    message.accountID.low >>> 0,
                    message.accountID.high >>> 0
                  ).toNumber()
                : message.accountID;
      if (message.gameID != null && message.hasOwnProperty('gameID'))
        object.gameID = message.gameID;
      if (message.token != null && message.hasOwnProperty('token'))
        object.token = message.token;
      if (message.route != null && message.hasOwnProperty('route'))
        object.route = message.route;
      if (message.apiID != null && message.hasOwnProperty('apiID'))
        object.apiID = message.apiID;
      return object;
    };

    /**
     * Converts this LifeServiceInitInfo to JSON.
     * @function toJSON
     * @memberof lifeServiceProto.LifeServiceInitInfo
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    LifeServiceInitInfo.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return LifeServiceInitInfo;
  })();

  return lifeServiceProto;
})();

module.exports = $root;
