/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/https";
 * import {onDocumentWritten} from "firebase-functions/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import * as admin from "firebase-admin";

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options.
setGlobalOptions({maxInstances: 10});

if (!admin.apps.length) {
  admin.initializeApp();
}

export {birthdays} from "./birthdays";
