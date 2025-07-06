/*
 * This script provides authentication functions for an AWS Cognito-based application.
 * It depends on the Amazon Cognito Identity SDK for JavaScript, which must be included in the HTML:
 * <script src="https://sdk.amazonaws.com/js/aws-sdk-2.7.16.min.js"></script>
 * <script src="https://rawgit.com/aws/amazon-cognito-identity-js/master/dist/aws-cognito-sdk.min.js"></script>
 * <script src="https://rawgit.com/aws/amazon-cognito-identity-js/master/dist/amazon-cognito-identity.min.js"></script>
 */

// Initialize the Amazon Cognito credentials provider
AWS.config.region = awsConfig.cognito.region;

const poolData = {
    UserPoolId: awsConfig.cognito.userPoolId,
    ClientId: awsConfig.cognito.userPoolClientId
};

const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

let cognitoUser; // Global variable to hold the user object for MFA

/**
 * Signs in a user with the provided email and password.
 * @param {string} email - The user's email address.
 * @param {string} password - The user's password.
 */
function signIn(email, password) {
    console.log('Attempting to sign in user:', email);

    const authenticationData = {
        Username: email,
        Password: password,
    };
    const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);

    const userData = {
        Username: email,
        Pool: userPool
    };
    cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    console.log('CognitoUser object created:', cognitoUser);

    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function (result) {
            console.log('Authentication successful:', result);
            const accessToken = result.getAccessToken().getJwtToken();
            // Store the token in localStorage for session management
            localStorage.setItem('aws-native-token', accessToken);
            console.log('Authentication successful');
            // Redirect to the dashboard without creating browser history entry
            window.location.replace('dashboard-aws-native.html');
        },
        onFailure: function (err) {
            console.error('Authentication failed:', err);
            const loginButton = document.getElementById('loginButton');
            const loadingSpinner = document.getElementById('loadingSpinner');
            loginButton.disabled = false;
            loadingSpinner.style.display = 'none';
            
            const errorMessage = document.getElementById('errorMessage');
            errorMessage.textContent = err.message || JSON.stringify(err);
            errorMessage.style.display = 'block';
        },
        mfaRequired: function(codeDeliveryDetails) {
            console.log('MFA is required. Details:', codeDeliveryDetails);
            // MFA is required to complete sign-in
            console.log('MFA required', codeDeliveryDetails);
            
            // Hide login form, show MFA form
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('mfaForm').style.display = 'block';
        },
        newPasswordRequired: function(userAttributes, requiredAttributes) {
            console.log('New password required. User attributes:', userAttributes);
            console.log('Required attributes:', requiredAttributes);
            
            // Reset the loading state
            const loginButton = document.getElementById('loginButton');
            const loadingSpinner = document.getElementById('loadingSpinner');
            loginButton.disabled = false;
            loadingSpinner.style.display = 'none';
            
            // Show the new password form
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('newPasswordForm').style.display = 'block';
        }
    });
}

/**
 * Submits the MFA code to complete the sign-in process.
 * @param {string} mfaCode - The MFA code from the user's authenticator app.
 */
function submitMfaCode(mfaCode) {
    console.log('Submitting MFA code:', mfaCode);

    cognitoUser.sendMFACode(mfaCode, {
        onSuccess: function (result) {
            console.log('MFA submission successful:', result);
            const accessToken = result.getAccessToken().getJwtToken();
            localStorage.setItem('aws-native-token', accessToken);
            console.log('MFA successful, authentication complete.');
            window.location.replace('dashboard-aws-native.html');
        },
        onFailure: function (err) {
            console.error('MFA submission failed:', err);
            const mfaButton = document.getElementById('mfaButton');
            const mfaLoadingSpinner = document.getElementById('mfaLoadingSpinner');
            mfaButton.disabled = false;
            mfaLoadingSpinner.style.display = 'none';

            const errorMessage = document.getElementById('errorMessage');
            errorMessage.textContent = err.message || JSON.stringify(err);
            errorMessage.style.display = 'block';
        }
    });
}

/**
 * Submits a new password when required by Cognito.
 * @param {string} newPassword - The new password to set.
 */
function submitNewPassword(newPassword) {
    console.log('Submitting new password...');
    
    cognitoUser.completeNewPasswordChallenge(newPassword, {}, {
        onSuccess: function (result) {
            console.log('New password set successfully:', result);
            const accessToken = result.getAccessToken().getJwtToken();
            localStorage.setItem('aws-native-token', accessToken);
            console.log('Password change successful, authentication complete.');
            window.location.replace('dashboard-aws-native.html');
        },
        onFailure: function (err) {
            console.error('New password submission failed:', err);
            const newPasswordButton = document.getElementById('newPasswordButton');
            const newPasswordLoadingSpinner = document.getElementById('newPasswordLoadingSpinner');
            newPasswordButton.disabled = false;
            newPasswordLoadingSpinner.style.display = 'none';

            const errorMessage = document.getElementById('errorMessage');
            errorMessage.textContent = err.message || JSON.stringify(err);
            errorMessage.style.display = 'block';
        }
    });
}

/**
 * Signs out the current user.
 */
function signOut() {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser != null) {
        cognitoUser.signOut();
        localStorage.removeItem('aws-native-token');
        console.log('User signed out.');
        window.location.href = 'login-aws-native.html';
    }
}

/**
 * Checks if a user is currently authenticated (for login page redirect).
 * Returns a promise that resolves to true if authenticated, false otherwise.
 */
function isUserAuthenticated() {
    return new Promise((resolve) => {
        const cognitoUser = userPool.getCurrentUser();
        if (cognitoUser == null) {
            resolve(false);
        } else {
            cognitoUser.getSession(function(err, session) {
                if (err || !session || !session.isValid()) {
                    // Clear invalid token
                    localStorage.removeItem('aws-native-token');
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        }
    });
}

/**
 * Checks if a user is currently authenticated.
 * If not, redirects to the login page.
 */
function checkAuthentication() {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser == null) {
        window.location.href = 'login-aws-native.html';
    } else {
        cognitoUser.getSession(function(err, session) {
            if (err || !session.isValid()) {
                window.location.href = 'login-aws-native.html';
            }
        });
    }
}
