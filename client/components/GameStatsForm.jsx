var React = require('react');
var firebase = require('firebase/app');
var db = require('./../../firebaseinitialize.js')

class GameStatsForm extends React.Component {
  constructor(props){
    super(props);


    this.state = {
      player_1_score: '',
      player_2_score: ''
    };

  }



  handleInputChangeHome(event) {
    this.setState({
      player_1_score: event.target.value
    });
  }

  handleInputChangeAway(event) {
    this.setState({
      player_2_score: event.target.value
    });
  }

  insertStats(event) {

    var self = this;
    var playerRef;
    console.log('current game:', this.props.currentGame);
    var tourneyId = this.props.currentGame.tournament_id;
    if(!self.state.pongView){
      playerRef = db.ref('fifa/tournaments/' + tourneyId + '/games/' + self.props.currentGame.id)
    } else {
      playerRef = db.ref('pong/tournaments/' + tourneyId + '/games/' + self.props.currentGame.id)
    }
    event.preventDefault();
    var updatedGame = self.props.currentGame;
    updatedGame.player1_score = self.state.player_1_score;
    updatedGame.player2_score = self.state.player_2_score;
    updatedGame.status = 'disabled';

    playerRef.set(updatedGame)
    .then(function() {
      self.props.updateGames(tourneyId);
      self.setState({
        player_1_score: '',
        player_2_score: ''
      });
    });

  }
            // <label htmlFor="player1_id">Home</label>
            // <label htmlFor="player2_id" >Away</label>

  render() {
    return (

      <form className="form-inline" onSubmit={this.insertStats.bind(this)} autoComplete="off">
        <div className="row">

          <div className="col-xs-10">
            <div className="form-group form-group-sm">
            <input type="text"
              className="form-control player1-score col-xs-2"
              id="player1_id"
              value={this.state.player_1_score}
              onChange={this.handleInputChangeHome.bind(this)}
              placeholder="Home Final" />

            <input type="text"
              className="form-control player2-score col-xs-2"
              id="player2_id"
              value={this.state.player_2_score}
              onChange={this.handleInputChangeAway.bind(this)}
              placeholder="Away Final" />
            </div>
          </div>

          <div className="col-xs-2">
            <button type="submit" className="btn btn-default btn-xs">END GAME</button>
          </div>

        </div>

      </form>
    );
  }
}


module.exports = GameStatsForm;
