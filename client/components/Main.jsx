var React = require('react');
var ReactDOM = require('react-dom');
var axios = require('axios'); //Used for AJAX calls
var AllPlayersList = require('./AllPlayersList.jsx');
var Player = require('./Player.jsx');
var NewTournamentPlayers = require('./NewTournamentPlayers.jsx');
var GameStatsForm = require('./GameStatsForm.jsx');
var AddPlayerForm = require('./AddPlayerForm.jsx');
var StartTournament = require('./StartTournament.jsx');
var CurrentTournament = require('./CurrentTournament.jsx');
var FinishTournament = require('./FinishTournament.jsx');
var OngoingTournamentsList = require('./OngoingTournamentsList.jsx');
var StatsTable = require('./StatsTable.jsx')

class Main extends React.Component {

  constructor() {
    super();
    this.state = {
      // currentTournamentTable will hold objects for each player in the current tournament.
        // These objects will have all the stats to be rendered to the Tournament's Table/Standings
      currentTournamentTable: [],
      // allPlayersList holds all existing players as objects.
        // These objects have id and username keys/values.
      allPlayersList: [],
      // tourneyPlayersList holds all players in the current/to be created tournament
        // Same player objects as the allPlayersList
      tourneyPlayersList: [],
      // currentGame will (surprise!) hold the current game.
        // This allows us to add data to this game from the GameStatsForm
      currentGame: null,
      // currentTournamentGames hold all the current tournament's games. (Seeing a patern here? ;p)
        // Each item in the array is a game object. These game objects hold player1_id, player2_id and
        // a bunch of data fields to track the stats.
      currentTournamentGames: [],
      // Bet you can guess what currentTournament is :D.
      currentTournament: null,
      // This one here isn't to hard to guess either!
      ongoingTournamentsList: [],

      statsView: false,
      statLines: []
    };
  }

  // getAllPlayers makes a call to the server for all players from the database.
  getAllPlayers() {
    var self = this;
    // axios rocks and makes nice promise based calls to the server for us.
    axios.get('/api/player')
      .then(function(playerData) {
        var tourneyPlayerIds = self.state.tourneyPlayersList.map(function(tourneyPlayer) {
          return tourneyPlayer.id; //Returns a list of players already in the tourney
        });
        var notAdded = playerData.data.filter(function(player) {
          return tourneyPlayerIds.indexOf(player.id) === -1; //Returns a list of players not in the tourney from the db
        });
        self.setState({
          allPlayersList: notAdded //Adds the players from the db not already in a tourney to allPlayersList
        });
      })
      .catch(function(err) {
        // Handle any errors here.
        console.log('Error in getting players from the DB:', err);
      });
  }

  // This function makes a call for all tournaments from the server and adds them to the state.
  getOngoingTournaments() {
    var self = this;
    axios.get('/api/tournaments')
    .then(function(tourneys) {
      self.setState({
        ongoingTournamentsList: tourneys.data
      });
    })
    .catch(function(err) {
      // Handle any errors here
      console.log('Error in getting tourneys from the DB', err);
    });
  }

  componentDidMount() {
    this.getAllPlayers();
    this.getOngoingTournaments();
  }

  //createTournament will make a post request to the server, which will insert the
    // new tournament into the DB, and after that call the createGames function
  createTournament(tourneyName) {
    var context = this;
    // post request to the /api/tournaments endpoint with the tourneyName included
    axios.post('/api/tournaments', {
      // NOTE: This route is not finished yet
      tournament_name: tourneyName
    }).then(function(response) {
      // response.data holds an array with one number in it
        // this number is the tournamentId
      var tourneyId = response.data[0];

        // set the currentTournament key on state to an object with the id and name
      context.setState({
        currentTournament: { id: tourneyId, tournament_name: tourneyName }
      });

      // then call createGames with the new tourney ID
      context.createGames.call(context, tourneyId);
    }).catch(function(err) {
      // handles some errors
      console.log(err, 'failed to create tournament');
    });
  }

  // createGames will be called when the button linked to createTournament is clicked.
  createGames(tourneyId) {
    var self = this;
    // Post request to the /api/games endpoint with the the tourneyPlayerList.
    axios.post('/api/games', {
      tourneyId: tourneyId,
      players: this.state.tourneyPlayersList
    }).then(function(response) {
      // When the games are posted, get back all the games for the current tournament.
      axios.get('/api/games', {
        params: {
          tournament_id: tourneyId
        }
      }).then(function(response) {

        // Then if the games post and get were successful, we set currentTournament to true,
          // and add the array of game objects to the state.
        var games = response.data;
        console.log('before:', self.state.currentGame);
        self.setState({
          currentTournamentGames: games,
          currentGame: games[0],
        });
        console.log('after:', self.state.currentGame);

      }).catch(function(err) {
        // This error handles failures in the getting of games back.
        console.log('Error in get games with tourneyID:', err);
      });
    }).catch(function(err) {
      // This error handles failures posting games to the server/database.
      console.log(err, 'failed to post to games');
    });
  }



  // this function moves a Player component to the list they are not in
    // tourneyPlayersList into allPlayersList, and visa versa.
  movePlayer(playerComponent, index) {

    // check if the tourneyPlayersList has this Player
    if (this.state.tourneyPlayersList.includes(playerComponent)) {

      // if so, we move from that list with a splice.
      var out = this.state.tourneyPlayersList.splice(index, 1)[0];

      // then push the first index of that spliced out array into the allPlayersList
      this.state.allPlayersList.push(out);

      // force update should update the state now, as we are not setting state
        // inside a this.setState function
      this.forceUpdate();

    } else {
      // otherwise, we remove it from the players list and add to the touney list
      var out = this.state.allPlayersList.splice(index, 1)[0];

      // same thing as above, just removing from allPlayersList and adding to the
        //  tourneylist
      this.state.tourneyPlayersList.push(out);

      this.forceUpdate();

    }
  }

  setCurrentGame(index) {
    var newGame = this.state.currentTournamentGames[index];
    var oldGame = this.state.currentGame;

    console.log('Old:', oldGame, 'new', newGame);

    var checker = {
      newGame: [newGame, true],
      oldGame: [oldGame, false]
    };

    // axios.put('/api/games/currentGame', {game: game, current: isCurrent}).then(function(res) {
    //   console.log(res, 'good things?');
    // }).catch(function(err) {
    //   console.log('error in client utils:', err);
    // });




    this.setState({
      currentGame: newGame
    });



    this.updateGames(this.state.currentTournament.id);

  }

  setCurrentTournament(index, tourneyId) {
    this.setState({
      currentTournament: this.state.ongoingTournamentsList[index]
    });
    this.updateGames(tourneyId);
  }

  toggleStatsView() {
    this.setState({
      statsView : !this.state.statsView
    })
  }

  resetTournament() {
    this.setState({
      currentTournament : null
    })
  }


  finishTournament() {
    // set our context here.
    var self = this;

    // the sorting for the tournament table should happen on game submits,
      // so that means the first item in the currentTournamentTable array
      // should be the winner of our tournament when we end it!
    var winner = this.state.currentTournamentTable.shift();

    // grab the tournament we are in from state,
    var tournament = this.state.currentTournament;

    // and extend an object containing the winners name with the tournament object.
    var results = Object.assign({winnerName: winner.name}, tournament);

    // That results object will be passed into the put request to the server.
    axios.put('/api/tournament', results).then(function(response) {
      // This alert definitely doesnt work right now, but is a place holder for some sort of
        // Congradulations to the winner.
      alert('Congratulations to ' + winner.name + ' for winning the ' + tournament.tournament_name + ' tournament!');

      // Then we set our currentTournament back to false to go back to the create tournament page.
        // NOTE: this may change with multiple tournaments running at once
      self.setState({
        currentTournament: null
      });

    }).catch(function(err) {
      // A catch in the event the put request fails.
      console.log('FinishTournament Error:', err);
    });
  }

//GameStatsForm calls this function after it has PUT the entered stats in the database.
  updateGames(tourneyId) {
    //reusing the api call from createGames to make a call to the database with the updated game stats
    var self = this;
    axios.get('/api/games', {
      params: {
        tournament_id: tourneyId
      }
    }).then(function(response) {
        //Here it will show the updated game scores for each game that scores have been entered in. The GameStatsForm
        //PUTs the scores to the database then here we GET from the database to gather the new scores and show them on
        //the page
      var games = response.data;
      self.setState({
        currentTournamentGames: games,
      });
    })
      .then(function() { //After setting the games, we will also want to reset the players so that they are displayed correctly when we set a new currentTournament
        // Slight change here, buy adding a dictionary we can make this process O(n) instead of O(2^n).
        var dictionary = {};
        // The dictionary gives us a constant/instant time to check if the id is in the unique id list.
          // This lets us filter down to unique ids without nesting .includes or .indexOf.
        var uniquePlayerIds = [];

        // Here we iterate over the array of game objects to filter them down to unique IDs
        self.state.currentTournamentGames.forEach(function(game) { //Creating a unique list of players in each games
          if (dictionary[game.player1_id] === undefined) {
            uniquePlayerIds.push(game.player1_id);
          }
          dictionary[game.player1_id] = 'found';

          if (dictionary[game.player2_id] === undefined) {
            uniquePlayerIds.push(game.player2_id);
          }
          dictionary[game.player2_id] = 'found';

        });
        axios.get('./api/player', {
          params: {
            tournament_players: uniquePlayerIds
          }
        })
        .then(function(playersInCurrentTourney) {
          self.setState({
            tourneyPlayersList: playersInCurrentTourney.data
          });
        });
      });
  }

  render() {

    // if the stats view is enabled
    if (this.state.statsView) {
    return (
        <div className="background">
          <div className="container">
            <div className="jumbotron header">
              <h1>VIEW YOUR STATS!</h1>
              <p>
                Check out the lifetime stats of all your added players!
              </p>
            </div>

          </div>

          <div className="row">
            <div className="col-xs-1"></div>
            <div className="col-xs-4">
                <h3>.</h3>
                <h3>.</h3>
            </div>
            <div className="col-xs-3"></div>
            <div className="col-xs-3">
              <h3>.</h3>
              <button type="submit" className="btn btn-default" onClick={this.toggleStatsView.bind(this)}>VIEW TOURNAMENTS</button>
            </div>
            <div className="col-xs-1"></div>

          </div>


          <div className="row">

            <div className="col-xs-1">

            </div>

            <div className="col-xs-10">
              <StatsTable stats={this.state.statLines} changeView={this.toggleStatsView.bind(this)}/>
            </div>

            <div className="col-xs-1">

            </div>
          </div>

        </div>
      );
    } else if (this.state.currentTournament) {
      // render the CurrentTournament app
      return (
        <div className="background">
          <div className="container">
            <div className="jumbotron header">
              <h1>GAME TIME!</h1>
              <p>
                Start with your first game below, or click any game to start it!
              </p>
            </div>

          </div>

          <div className="row">
            <div className="col-md-1"></div>
            <div className="col-md-10">
              <FinishTournament finish={this.finishTournament.bind(this)}/>
            </div>
            <div className="col-md-1"></div>
          </div>

          <div className="row">
            <div className="col-xs-1"></div>
            <div className="col-xs-4">
            </div>
            <div className="col-xs-3"></div>
            <div className="col-xs-3">
              <button type="submit" className="btn btn-default" onClick={this.resetTournament.bind(this)}>HOME</button>
            </div>
            <div className="col-xs-1"></div>

          </div>

          <div className="row">

            <div className="col-xs-1">

            </div>

            <div className="col-xs-5">
              <CurrentTournament currentGame={this.state.currentGame} updateGames={this.updateGames.bind(this)} currentTournament={this.state.currentTournament} currentTournamentGames={this.state.currentTournamentGames} tourneyPlayersList={this.state.tourneyPlayersList} setCurrentGame={this.setCurrentGame.bind(this)}/>
            </div>

            <div className="col-xs-5">
              <div className="panel panel-default">
                <div className="panel-heading"><h3>TABLE</h3></div>
                <div className="panel-body">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Player</th>
                        <th>GP</th>
                        <th>Won</th>
                        <th>Loss</th>
                        <th>Draw</th>
                        <th>GD</th>
                      </tr>
                    </thead>
                    {/* NOTE: THIS WILL BE WHERE THE TABLE IS RENDERED. An outer element of <tbody> around each player's stats */}
                  </table>
                </div>
              </div>
            </div>

            <div className="col-xs-1">

            </div>
          </div>

        </div>
      );
    } else {
      // otherwise render the create tournament app.
      return (
        <div className="background">

          {/* this container holds the jumbotron */}
          <div className="container">
            <div className="jumbotron header">
              <h1>WELCOME</h1>
              <p>
                Create your tournament below by adding new players or picking from the list on the right!
              </p>
            </div>
          </div>


          {/* This row holds the add player form */}
          <div className="row">
            <div className="col-xs-1"></div>
            <div className="col-xs-4">
                <h3>ADD PLAYER</h3>
                <AddPlayerForm getAllPlayers={this.getAllPlayers.bind(this)} />
            </div>
            <div className="col-xs-3"></div>
            <div className="col-xs-3">
              <h3>.</h3>
              <button type="submit" className="btn btn-default" onClick={this.toggleStatsView.bind(this)}>VIEW STATS</button>
            </div>
            <div className="col-xs-1"></div>

          </div>


          {/* this row holds both lists of players */}
          <div className="row">
            <div className="col-xs-1">
            </div>

            <div className="col-xs-5">
              {/* this will render out through the Player component into the players that we will make the tournament with */}
              <div className="panel panel-default">
                <div className="panel-heading">
                  <h4>CREATE NEW TOURNAMENT</h4>
                </div>
                <div className="panel-body">
                  <StartTournament create={this.createTournament.bind(this)}/>
                  <NewTournamentPlayers players={this.state.tourneyPlayersList} click={this.movePlayer.bind(this)} />
                </div>
              </div>
              <OngoingTournamentsList tourneys={this.state.ongoingTournamentsList} click={this.setCurrentTournament.bind(this)}/>
            </div>

            <div className="col-xs-5">
              {/* this will render out with the existing players in the database, and ones added through the form */}
              <AllPlayersList players={this.state.allPlayersList} click={this.movePlayer.bind(this)}/>
            </div>

            <div className="col-xs-1">
            </div>
          </div>
        </div>
      );
    }
  }

}

module.exports = Main;
