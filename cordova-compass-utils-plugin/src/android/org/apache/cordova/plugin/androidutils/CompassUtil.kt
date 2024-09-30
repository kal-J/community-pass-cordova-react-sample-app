package org.apache.cordova.plugin.androidutils

import org.apache.cordova.CordovaPlugin
import org.apache.cordova.CallbackContext
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

import android.util.Log
import org.apache.cordova.plugin.androidutils.payloadEncryption.AESCipherWrap
import org.apache.cordova.plugin.androidutils.payloadEncryption.ClientSecurePayloadProducer
import org.apache.cordova.plugin.androidutils.payloadEncryption.CompassEncodedKeySpec
import org.apache.cordova.plugin.androidutils.payloadEncryption.PreferencesManager
import org.apache.cordova.plugin.androidutils.payloadEncryption.RSACipherWrap

class CompassUtil : CordovaPlugin() {
  private val rsaCipherWrap: RSACipherWrap by lazy { RSACipherWrap() }
  private val aesCipherWrap: AESCipherWrap by lazy { AESCipherWrap() }
  private val preferencesManager: PreferencesManager by lazy { PreferencesManager(context = reactContext) }
  private val clientSecurePayloadProducer: ClientSecurePayloadProducer by lazy { ClientSecurePayloadProducer() }


  override fun execute(
    action: String,
    args: JSONArray,
    callbackContext: CallbackContext
  ): Boolean {
    Log.i("action =>", action)
    if (action == "echo") {
      val message: String = args.getString(0)

      val payload: String = args.getString(0)
      Log.d("Args", payload.toString())
      prepareRequestPayload(payload, callbackContext)
      return true
    }

    if(action == "preparerequestpayload") {
      val payload: String = args.getString(0)
      Log.d("Args", payload.toString())
      prepareRequestPayload(payload, callbackContext)
      return true
    }

    return false
  }

  private fun echo(
    message: String,
    callbackContext: CallbackContext
  ) {
    if (message.isNotEmpty()) {
      callbackContext.success(message);
    } else {
      callbackContext.error("Expected one non-empty string argument.");
    }
  }
  
  fun generateRsaKeyPair(
    callbackContext: CallbackContext
  ){
    val rsaKeyPair = rsaCipherWrap.generateKeyPair()
    val publicKey = CompassEncodedKeySpec.encodeToString(rsaKeyPair.public)

    val resultMap = Arguments.createMap().apply {
      putString("publicKey", publicKey)
    }
    callbackContext.success(resultMap)
  }

  fun generateAesKey(callbackContext: CallbackContext){
    val aesSecretKey =  aesCipherWrap.generateAESKey()
    val aesStringKey = aesCipherWrap.aesSecreteKeyToString(aesSecretKey)

    val resultMap = Arguments.createMap().apply {
      putString("aesSecretKey", aesStringKey)
    }
    callbackContext.success(resultMap)
  }

  fun prepareRequestPayload(payload: ReadableMap, callbackContext: CallbackContext){
    if(!(payload.hasKey("cmt") && payload.hasKey("bridgeRaPublicKey"))) {
      val resultMap = Arguments.createMap().apply {
        putInt("code", 0)
        putString("message", "Missing  parameter")
      }
      callbackContext.error("error", resultMap)
    } else {
      val cmt = payload.getString("cmt") ?: ""
      val bridgeRaPublicKey = payload.getString("bridgeRaPublicKey") ?: ""
      val response = clientSecurePayloadProducer.prepareRequestPayload(cmt, bridgeRaPublicKey)
      val resultMap = Arguments.createMap().apply {
        putString("requestData", response)
      }
      callbackContext.success(resultMap)
    }
  }


}