var React = require('react');
var Button = require('react-native-button');
var firebase = require('firebase');
require('firebase/auth');
require('firebase/database');

class LoginForm extends React.Component {
  constructor(props) {
    super(props)
  }


  facebookLogin () {
    var provider = new firebase.auth.FacebookAuthProvider();
    firebase.auth().signInWithPopup(provider)
    .then(function(result) {
      var token = result.credential.accessToken;
      var user = result.user;
      console.log('user: ', user)
    }).catch(function(error) {
      var errorCode = error.code;
      var errorMessage = error.message;
      var email = error.email;
      var credential = error.credential;
      console.log('errorCode: ', errorCode, ' message: ', errorMessage)
    })
  }

  twitterLogin () {
    var provider = new firebase.auth.TwitterAuthProvider();
    firebase.auth().signInWithPopup(provider).then(function(result) {
      var token = result.credential.accessToken;
      var secret = result.credential.secret;
      // The signed-in user info.
      var user = result.user;
      console.log('user: ', user, ' is signed in')
    }).catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      // The email of the user's account used.
      var email = error.email;
      // The firebase.auth.AuthCredential type that was used.
      var credential = error.credential;
      console.log('sign in failed');
    })
  }

  googleLogin () {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).then(function(result) {
      var token = result.credential.accessToken;
      // The signed-in user info.
      var user = result.user;
      console.log('user: ', user, ' is signed in')
    }).catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      // The email of the user's account used.
      var email = error.email;
      // The firebase.auth.AuthCredential type that was used.
      var credential = error.credential;
      console.log('errorCode: ', errorCode, 'errorMessage: ', errorMessage);
    })
  }

  signOut () {
    firebase.auth().signOut().then(function() {
      console.log('signed out');
    }, function(error) {
      console.log('sign out failed: ', error);
    })
  }

  render () {
    return (
      <div>
        <div className="google-btn">
          <Button style={{ borderWidth: 1, borderColor: 'green'}}
                  onPress={ this.googleLogin() }>
          Sign in with Google
          </Button>
        </div>
        <div className="facebook-btn">
          <Button style={{ borderWidth: 1, borderColor: 'blue'}}
                  onPress={ this.facebookLogin() }>
          Sign in with Facebook
          </Button>
        </div>
        <div className="twitter-btn">
          <Button style={{ borderWidth: 1, borderColor: 'lightblue'}}
                  onPress={ this.twitterLogin() }>
          Sign in with Twitter
          </Button>
        </div>
        <div className="logout">
          <Button style={{ borderWidth: 1, borderColor: 'red'}}
                  onPress={ this.signOut() }>
          Sign out
          </Button>
        </div>
      </div>
    )
  }
}

module.exports = LoginForm;
