/*jshint esversion: 6 */
const React = require('react');
// var axios = require('axios');
// const firebase = require("firebase/app");
const db = require('../../firebaseinitialize.js');

class Form extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      value: '',
      noError: true
    };
  }

  handleInputChange(event) {
    this.setState({
      value: event.target.value
    });
  }

  //When Add User Form is filled out this function will be called onSubmit. Prevents the page from
  //refreshing, posts the new user to the database, then displays this new user in the player list.
  //If the username already exists in the database it will display an error on the page.
  addNewPlayer(event) {
    var self = this;
    event.preventDefault();
    console.log('add player form props?:', this.props);
    var userPath;
    if(!this.props.parentState.pongView){
      userPath = db.ref('fifa/players/').push();
      userPath.set({
        username: this.state.value,
        uid: userPath.key
      });
    } else {
      console.log('setting to pong players');
      userPath = db.ref('pong/players/').push();
      userPath.set({
        username: this.state.value,
        uid: userPath.key
      });
    }
    this.setState({
      value: ''
    });

    // axios.post('/api/player', {
    //   username: this.state.value
    // }).then(function(res) {
    //   self.state.noError = true;
    //   self.state.value = '';
    //   self.props.addPlayer();
    // }).catch(function(error) {
    //   console.log(error);
    //   self.state.noError = false;
    //   self.state.value = '';
    //   self.props.addPlayer();
    // });
  }

  render() {
    if (this.state.noError) {
      return (

        <form className="form-inline" onSubmit={this.addNewPlayer.bind(this)} autoComplete="off">
          <div className="form-group">
            <input type="text"
              className="form-control user-form"
              id="username"
              value={this.state.value}
              placeholder="Add User"
              onChange={this.handleInputChange.bind(this)} />
          </div>
          <button type="submit" className="btn btn-default">ADD</button>
        </form>

      );

    } else {
      return (

        <form className="form-inline" onSubmit={this.addNewPlayer.bind(this)} autoComplete="off">
          <div className="form-group">
            <input type="text"
              className="form-control user-form"
              id="username"
              value={this.state.value}
              placeholder="Please try again"
              onChange={this.handleInputChange.bind(this)} />
          </div>
          <button type="submit" className="btn btn-danger player-exists-btn">USER EXISTS</button>
          <p className="user-oops">Oops, that name is taken! Try again!</p>
        </form>

      );
    }
  }
}

module.exports = Form;
