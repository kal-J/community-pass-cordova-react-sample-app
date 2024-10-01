import * as env from "../env.ts";
import { WebIntent } from "@awesome-cordova-plugins/web-intent";


export const prepareCMT = (data: {
    participationProgramId: string,
    transactionTagId: string,
    status: string,
    payload: Record<string, any>
}) => {
    return (
        {
            systemInfo: {
                "type": "Request"
            },
            commonAttributes: {
                clientAppDetails: {
                    reliantAppId: env.RELIANT_APP_GUID
                },
                serviceProvider: {
                    participationProgramId: data.participationProgramId
                },
                transaction: {
                    tagId: data.transactionTagId,
                    status: data.status
                }
            },
            custom: {
                ClientConstraint: [
                    "commonAttributes.transaction.tagId"
                ]
            },
            payload: {
                ...data.payload
            }
        }
    );
}

const intentOptions = (extras: {
    REQUEST_CODE: string,
    REQUEST_DATA: string
}) => {
    const options = {
        action: WebIntent.ACTION_SEND,
        component: {
            package: env.PACKAGE_NAME,
            class: "com.mastercard.compass.bridgera.CommunityPassUnifiedApi",
        },
        type: "text/plain",
        extras: extras,
    };
    return options;
};

export const executeUnifiedApiRequest = async (requestCode: string, requestData: string): Promise<any> => {
    let cpError: any = null;
    const result = await WebIntent.startActivityForResult(intentOptions({
        REQUEST_CODE: requestCode,
        REQUEST_DATA: requestData
    })).then(
        (res) => {
            if (res) {
                console.log(JSON.parse(res.extras?.RESPONSE_DATA));
                return res;
            }
        },
        (err) => {
            console.log(JSON.parse(err.extras?.RESPONSE_ERROR));
            return err;
        }
    );


    if (!result) {
        return Promise.resolve({
            error: cpError,
        });
    }
    console.log("RESULT CODE: ", result?.resultCode);

    if (result?.resultCode == -1) {
        const responseData: string = (result?.extra as any)?.RESPONSE_DATA;
        console.log("responseData:", responseData);

        /* const response = await parseResponsePayload(responseData);
        const payload = JSON.parse(response?.responseData).payload;

        console.log('response.responseData: ', JSON.parse(response.responseData), "\n");
        return Promise.resolve({
            payload: payload
        }); */
    } else {
        const responseError: string = (result?.extra as any)?.RESPONSE_ERROR;
        console.log("responseError: ", responseError, "\n");
        const payload = JSON.parse(responseError).payload;
        return Promise.resolve({
            error: {
                action: payload?.action,
                errorMessage: payload?.data?.errorMessage,
                extraErrorMessage: payload?.data?.extraErrorMessage
            }
        });
    }
}

export const getInstanceId = async function () {
    const requestData = JSON.stringify(prepareCMT({
        participationProgramId: env.CREDENTIAL_PROGRAM_GUID,
        transactionTagId: 'BridgeRA',
        status: 'Testing',
        payload: {
            reliantAppGuid: env.RELIANT_APP_GUID,
            raPublicKey: env.RA_PUBLIC_KEY,
        },
    }));

    const response = await executeUnifiedApiRequest('1053', requestData);
    console.log("response: ", response);
    if (!response?.payload?.data?.instanceId) {
        console.log("Failed to get instanceId");
        return null;
    }
    window.localStorage.setItem('instanceId', response.payload.data.instanceId);
    window.localStorage.setItem('bridgeRAEncPublicKey', response.payload.data?.bridgeRAEncPublicKey);
    window.localStorage.setItem('poiDeviceId', response.payload.data?.poiDeviceId);
    window.localStorage.setItem('svaIntegrityKey', response.payload.data?.svaIntegrityKey);

    return ({
        instanceId: response.payload.data?.instanceId,
        poiDeviceId: response.payload.data?.poiDeviceId,
        svaIntegrityKey: response.payload.data?.svaIntegrityKey,
        bridgeRAEncPublicKey: response.payload.data?.bridgeRAEncPublicKey
    });

}