import logo from "./logo.svg";
import "./App.css";
import { WebIntent } from "@awesome-cordova-plugins/web-intent";
import { getInstanceId, prepareCMT } from "./utils/compass-helper.ts";
import * as env from "./env.ts";

function successHandler(message) {
  console.log("success:", message);
}

function errorHandler(err) {
  console.log("failed", err);
}

var service = "CompassUtil";
var action = "echo";
var args = [(
  {
    cmt: (prepareCMT({
      participationProgramId: env.CREDENTIAL_PROGRAM_GUID,
      payload: {
        consentValue: 1,
      },
      status: "Testing",
      transactionTagId: "BridgeRA",
    })),
    bridgeRaPublicKey: window.localStorage.getItem("bridgeRAEncPublicKey"),
  }
)];

function App() {
  return (
    <div className="App">
      <div>
        <button className="btn-instance-id" onClick={() => getInstanceId()}>
          Get Instance Id
        </button>
      </div>

      <div>
        <button
          className="btn-instance-id"
          onClick={() => {
            window.cordova.exec(
              successHandler,
              errorHandler,
              service,
              action,
              args
            );
          }}
        >
          Test native action
        </button>
      </div>
    </div>
  );
}

export default App;
