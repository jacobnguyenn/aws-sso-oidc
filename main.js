configDotenv();
import {  SSOOIDC } from "@aws-sdk/client-sso-oidc";
import { setTimeout } from 'node:timers/promises';
const clientName = "capibara capibere";
const clientRegistrationType = 'public'
const scopesSsoAccountAccess = ['sso:account:access']
const ssoStartUrl = process.env.SSO_START_URL
const deviceGrantType = 'urn:ietf:params:oauth:grant-type:device_code'
import { AuthorizationPendingException} from '@aws-sdk/client-sso-oidc'
import { configDotenv } from "dotenv";

const client = new SSOOIDC({ region: "ap-southeast-1" });

try {
    const response = await client.registerClient({
      clientName: clientName,
      clientType: clientRegistrationType,
      scopes: scopesSsoAccountAccess,
    })
    console.log(`registerClient:response: ${JSON.stringify(response)}`)
    const authorization = await client.startDeviceAuthorization({
      startUrl: ssoStartUrl,
      clientId: response.clientId,
      clientSecret: response.clientSecret,
    })
    console.log(`startDeviceAuthorization:authorization: ${JSON.stringify(authorization)}`)

    const tokenRequest = {
      /** input parameters */
      clientId: response.clientId,
      clientSecret: response.clientSecret,
      grantType: deviceGrantType,
      deviceCode:  authorization.deviceCode,
    };
    while (true) {
      try {
        const data = await client.createToken(tokenRequest);
        // process data.
        if (data.accessToken) {
          console.log(`client:createToken:accessToken: ${data.accessToken}`); 
          break;
        }
        await setTimeout(5000);
      }
      catch (error){
        if (!(error instanceof AuthorizationPendingException)) {
          throw error
        }
      }
    }
} catch (error) {
  console.error(error);
  // error handling.
}


/**
 * Sleeps for the specified duration in milliseconds. Note that a duration of 0 will always wait 1 event loop.
 *
 * Attempts to use the extension-scoped `setTimeout` if it exists, otherwise will fallback to the global scheduler.
 */
function sleep(duration) {
  const schedule = globals?.clock?.setTimeout ?? setTimeout
  return new Promise(r => schedule(r, Math.max(duration, 0)))
}

