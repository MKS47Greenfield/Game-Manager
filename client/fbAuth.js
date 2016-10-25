var firebase = require('firebase');
require('firebase/auth');
require('firebase/database')

var provider = new firebase.auth.FacebookAuthProvider();

exports.fbSignIn = firebase.auth().signInWithPopup(provider)
  .then(function(result) {
  // This gives you a Facebook Access Token. You can use it to access the Facebook API.
  var token = result.credential.accessToken;
  // The signed-in user info.
  var user = result.user;
  console.log('user: ', user)
  // ...
}).catch(function(error) {
  // Handle Errors here.
  var errorCode = error.code;
  var errorMessage = error.message;
  // The email of the user's account used.
  var email = error.email;
  // The firebase.auth.AuthCredential type that was used.
  var credential = error.credential;
  console.log('errorCode: ', errorCode, 'message: ', errorMessage)
});

exports.fbSignOut = firebase.auth().signOut().then(function() {
  console.log('signed out')
}, function(error) {
  console.log(error)
});