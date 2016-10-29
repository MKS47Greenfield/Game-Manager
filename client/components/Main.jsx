/* jshint esversion:6 */
const React = require('react');
const ReactDOM = require('react-dom');
// const axios = require('axios'); //Used for AJAX calls


const firebase = require("firebase/app");
const db = require('./../../firebaseinitialize.js');
let usersRef;
let playersRef;
let tourneysRef;
let gamesRef;
let currentPlayersList;
let currentTourneyList;

// const rebase = require('./Rebase.jsx');//used to hook up firebase and react

const AllPlayersList = require('./AllPlayersList.jsx');
const Player = require('./Player.jsx');
const NewTournamentPlayers = require('./NewTournamentPlayers.jsx');
const GameStatsForm = require('./GameStatsForm.jsx');
const AddPlayerForm = require('./AddPlayerForm.jsx');
const StartTournament = require('./StartTournament.jsx');
const CurrentTournament = require('./CurrentTournament.jsx');
const FinishTournament = require('./FinishTournament.jsx');
const OngoingTournamentsList = require('./OngoingTournamentsList.jsx');
const StatsTable = require('./StatsTable.jsx');
const PongStatsTable = require('./PongStatsTable');
const utils = require('../fireUtils.js');
const Login = require('./Login.jsx');


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
      allFifaPlayersList: [],
      allPongPlayersList: [],
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
      ongoingFifaTournamentsList: [],
      ongoingPongTournamentsList: [],

      statsView: false,

      pongView: false,

      pongStatsView: false,

      statLines: []
    };
  }

  componentWillMount() {//for more info on this set up see
    //https://firebase.googleblog.com/2014/05/using-firebase-with-reactjs.html
    console.log(this.state.pongView);
    const self = this;
    usersRef = 'users/';
    playersRef = 'fifa/players/';
    tourneysRef = 'fifa/tournaments/';
    gamesRef = 'fifa/games/';
    currentPlayersList = 'allFifaPlayersList';
    currentTourneyList = 'ongoingFifaTournamentsList';
    //
    //   console.log(usersRef);

    db.ref('users/').on('child_added', function(snapshot) {
      self.state.allPlayersList.push(snapshot.val());
      self.state.allFifaPlayersList.push(snapshot.val());
      self.state.allPongPlayersList.push(snapshot.val());
      self.forceUpdate();
    });

    db.ref('fifa/players/').on('child_added', function(snapshot) {
      self.state.allFifaPlayersList.push(snapshot.val());
      self.state.allPlayersList.push(snapshot.val());
      self.forceUpdate();
    });
    db.ref('pong/players/').on('child_added', function(snapshot) {
      self.state.allPongPlayersList.push(snapshot.val());
      self.state.allPlayersList.push(snapshot.val());
      self.forceUpdate();
    });

    var ongoingFifaTournamentsList = [];
    var ongoingPongTournamentsList = [];
    db.ref(tourneysRef).on('child_added', function(snapshot) {
      ongoingFifaTournamentsList.push({
        tourneyId: snapshot.key,
        data: snapshot.val()
      });
      this.setState({
        ongoingFifaTournamentsList: ongoingFifaTournamentsList
      });
      this.state.ongoingTournamentsList.push(ongoingFifaTournamentsList);
    }.bind(this));

    db.ref('pong/tournaments/').on('child_added', function(snapshot) {
      ongoingPongTournamentsList.push({
        tourneyId: snapshot.key,
        data: snapshot.val()
      });
      this.setState({
        ongoingPongTournamentsList: ongoingPongTournamentsList
      });
      this.state.ongoingTournamentsList.push(ongoingPongTournamentsList);
    }.bind(this));
  }

  addPlayer() {//NOTE:all handled by listeners in component willmount now
    // get some 'this' binding
    // var self = this;
    // // getAllPlayers needs access to the state for the list of tournament players, so it accepts that as an argument.
    // var playersArr = [];
    // usersRef.once('value', function(snapshot) {
    //   snapshot.forEach(function(childSnapshot) {
    //     playersArr.push({
    //       username: childSnapshot.key,
    //       data: childSnapshot.val()
    //     });
    //   });
    // }).then(function () {
    //   self.setState({
    //     // Adds the players from the db not already in a tourney to allPlayersList
    //     allPlayersList: playersArr
    //   });
    // });
  }

    // utils.getAllPlayers(this.state).then(function(response) {
      // So within a .then we can set the state to the players array

  //createTournament will make a post request to the server, which will insert the
    // new tournament into the DB, and after that call the createGames function
  createTournament(tourneyName) {
    var self = this;
    // post request to the /api/tournaments endpoint with the tourneyName included
    if (this.state.tourneyPlayersList.length < 2) {
      console.log('not enough players in tournament');
      return;
    }

    console.log('MAIN cT tourneyName: ', tourneyName);
    var newTourneyRef = db.ref(tourneysRef).push();

    // newTourneyRef.set({
    //   'tourneyName': tourneyName,
    // }, function(err) {
    //   if (err) {
    //     console.log('error: ', err);
    //   }
    // });
    self.setState({
      // currentTournamentTable: res,
      currentTournament: { id: newTourneyRef.key, data:{ tourneyName: tourneyName } }
    });
    console.log('tourney players:', this.state.tourneyPlayersList);
    return this.createGames(newTourneyRef, tourneyName, this.state.tourneyPlayersList);
  }

  // createGames will be called when the button linked to createTournament is clicked.
  createGames(newTourneyRef, tourneyName, list) {
    var self = this;
    var playersList = list.slice();
    var playersList2 = list.slice();

    var tourneyId = newTourneyRef.key;
    // This inner function is used to makeGames.
    function makeGames(tourneyId, list) {
      var games = [];
      let gameCounter = 0;


      // while there is more than one player in the tourneyPlayersList,
      while (list.length > 1) {

        // shift the first item off and hold it with our nextPlayer variable,
        var nextPlayer = list.shift();
        // then forEach player left in there, create a game with the nextPlayer
        // and push that game into the games array.
        list.forEach(function(playerObj) {

          // This will be the object pushed into the games array.
          var gameObj = {};
          // set the needed values for the game object
          gameObj.player1_id = nextPlayer.uid;
          gameObj.player1_name = nextPlayer.username;
          gameObj.player2_id = playerObj.uid;
          gameObj.player2_name = playerObj.username;
          gameObj.tournament_id = tourneyId;
          gameObj.tournament_name = tourneyName;
          gameObj.id = gameCounter;
          gameObj.status = 'created';

          gameCounter++;
          // push into the games array
          games.push(gameObj);
        });
      }
      list.shift();
      return games;
    }
    // Call it!!
    var games = makeGames(tourneyId, playersList2);
    // return the promise from the query
    // return knex('games').insert(games);
    console.log('playersList:', playersList);
    console.log('tourneyId:', tourneyId);

    //FIREBASE
    console.log('games:', games);

    let gameCounter = 0;
    let gameId;
    db.ref(tourneysRef).child(tourneyId).set({
        'games': games,
        'players': playersList,
        'tourneyName': tourneyName,
        'currentGame': games[0]
    });
    db.ref(tourneysRef).child(tourneyId).once('value').then(function(snapshot) {
      var currentTournament = snapshot.val();
      self.setState({
        currentGame: games[0],
        currentTournament: currentTournament
      });
    });
    return db.ref(gamesRef).push(games, function (error) {
      if (error) {
        console.log("Data could not be saved, because: " + error);
      } else {
        console.log("Data saved successfully.");
      }
    });//returns the path to the new data (not a list of the objects)



    // return utils.postGames(newTourneyRef, list)
    //   .then(function(response) {
    //     // getGamesByTourneyId returns a promise object that resolves with two keys; games, and nextGame
    //     utils.getGamesByTourneyId(newTourneyRef).then(function(res) {
    //       self.setState({
    //         // We take those and set them to their appropriate state keys.
    //         currentTournamentGames: res.games,
    //         currentGame: res.nextGame
    //       });
    //     })
    //     .catch(function(err) {
    //       // This error handles failures in the getting of games back.
    //       console.log('Error in get games by tourneyID:', err);
    //     });
    //   }).catch(function(err) {
    //     // This error handles failures posting games to the server/database.
    //     console.log(err, 'failed to post to games');
    //   });
  }

  // this function moves a Player component to the list they are not in
    // tourneyPlayersList into allPlayersList, and visa versa.
  movePlayer(playerComponent, index) {
if (!this.state.pongView) {
  // check if the tourneyPlayersList has this Player
  if (this.state.tourneyPlayersList.includes(playerComponent)) {

    // if so, we move from that list with a splice.
    var out = this.state.tourneyPlayersList.splice(index, 1)[0];

    // then push the first index of that spliced out array into the allPlayersList
    this.state.allFifaPlayersList.push(out);

    // force update should update the state now, as we are not setting state
    // inside a this.setState function
    this.forceUpdate();

  } else {
    // otherwise, we remove it from the players list and add to the touney list
    var out = this.state.allFifaPlayersList.splice(index, 1)[0];

    // same thing as above, just removing from allPlayersList and adding to the
    //  tourneylist
    this.state.tourneyPlayersList.push(out);
    this.forceUpdate();
  }

} else {
  // check if the tourneyPlayersList has this Player
  if (this.state.tourneyPlayersList.includes(playerComponent)) {

    // if so, we move from that list with a splice.
    var out = this.state.tourneyPlayersList.splice(index, 1)[0];

    // then push the first index of that spliced out array into the allPlayersList
    this.state.allPongPlayersList.push(out);

    // force update should update the state now, as we are not setting state
    // inside a this.setState function
    this.forceUpdate();

  } else {
    // otherwise, we remove it from the players list and add to the touney list
    var out = this.state.allPongPlayersList.splice(index, 1)[0];

    // same thing as above, just removing from allPlayersList and adding to the
    //  tourneylist
    this.state.tourneyPlayersList.push(out);
    this.forceUpdate();
  }

}
  }

  // setCurrentGame takes in the game 'to be active', and the currently active game.
  setCurrentGame(toBeActive, currentActive) {
    // Some more this binding
    var self = this;

    // This handles the edge case of clicking on the game that is currently active.
    if (toBeActive.id === currentActive.id) {
      // Do nothing if the game you clicked on is already active.
      return;
    }
    console.log('toBeActive.id:',toBeActive.id);
    console.log('currentActive.id:',currentActive.id);
    // change the status key of each game to what we want.
    toBeActive.status = 'active';
    currentActive.status = 'created';
    db.ref(tourneysRef + '/' + self.state.currentTournament.tourneyId + '/games/' + toBeActive.id + '/').set(toBeActive);
    db.ref(tourneysRef + '/' + self.state.currentTournament.tourneyId + '/games/' + currentActive.id + '/').set(currentActive);
    db.ref(gamesRef + '/' + self.state.currentTournament.tourneyId + '/games/' + toBeActive.id + '/').set(toBeActive);
    db.ref(gamesRef + '/' + self.state.currentTournament.tourneyId + '/games/' + currentActive.id + '/').set(currentActive);

    // utils.updateGameStatus(toBeActive, currentActive).then(res => {
      // Then we update the games with the current tournament id
      console.log(self.state.currentTournament);
      self.updateGames(self.state.currentTournament.tourneyId);
    // });
  }

  setCurrentTournament(index, tourneyId) {

    var self = this;
    // Set the state of currentTournament to the tournament that was clicked on.
      // We do this by passing the index of the clicked on item up to this function,
      // then using that index to find the correct tournament in the ongoingTournamentsList.
    this.setState({
      currentTournament: this.state[currentTourneyList][index]
    });
    // When we have a currentTournament, update the games and players.
    this.updateGames(tourneyId, this.updatePlayers);

  }

  toggleStatsView() {
    var self = this;
    this.setState({
      statsView: !this.state.statsView,
      tourneyPlayersList: []
    });
    // call our getAllPlayers
    utils.getAllPlayers(this.state).then(res => {
      self.setState({
        allPlayersList: res
      });
    });
    // and call our getOngoingTournaments
    utils.getOngoingTournaments().then(function(tourneys) {
      self.setState({
        ongoingTournamentsList: tourneys
      });
    });
  }

  togglePongStatsView() {
    var self = this;
    this.setState({
      pongStatsView: !this.state.pongStatsView,
      tourneyPlayersList: []
    });
  }

  toggleBoth() {
    var self = this;

    if(this.state.pongStatsView) {
      this.setState({
        pongStatsView: !this.state.pongStatsView,
        pongView: !this.state.pongView
      })
    }else{
      this.setState({
        pongView: !this.state.pongView,
        statsView: !this.state.statsView
      });
    }
    // React.unmountComponentAtNode(document.getElementById('app'));
    // React.renderComponent(
    //   <Main pongView=(!this.props.pongView)/>, // JSX
    //   document.getElementById('app')
    // );
    if(!this.state.pongView){
      usersRef = 'users/';
      playersRef = 'fifa/players/';
      tourneysRef = 'fifa/tournaments/';
      gamesRef = 'fifa/games/';
      currentPlayersList = 'allFifaPlayersList';
      currentTourneyList = 'ongoingFifaTournamentsList';
    //
    //   console.log(usersRef);
    } else {
      usersRef = 'users/';
      playersRef = 'pong/players/';
      tourneysRef = 'pong/tournaments/';
      gamesRef = 'pong/games/';
      currentPlayersList = 'allPongPlayersList';
      currentTourneyList = 'ongoingPongTournamentsList';
    }
  }


  togglePongView() {
    console.log('figure out why pong state doesnt transfer to add player form as props');
    var self = this;
    this.setState({
      pongView: !this.state.pongView,
      tourneyPlayersList: []
    });
    if(!this.state.pongView){
      usersRef = 'users/';
      playersRef = 'fifa/players/';
      tourneysRef = 'fifa/tournaments/';
      gamesRef = 'fifa/games/';
      currentPlayersList = 'allPongPlayersList';
      currentTourneyList = 'ongoingFifaTournamentsList';
    //
    //   console.log(usersRef);
    } else {
      usersRef = 'users/';
      playersRef = 'pong/players/';
      tourneysRef = 'pong/tournaments/';
      gamesRef = 'pong/games/';
      currentPlayersList = 'allFifaPlayersList';
      currentTourneyList = 'ongoingPongTournamentsList';
    }
    console.log('current players list',currentPlayersList)
  }


  finishTournament() {
    // set our self here.
    var self = this;
    var tournament = this.state.currentTournament;

    var allPlayas = self.state[currentPlayersList].concat(self.state.tourneyPlayersList);
    var uniquePlayas = utils.filterToUniquePlayers(allPlayas);
    var tourneysSlice = this.state.ongoingTournamentsList.slice();
    for(var i = tourneysSlice - 1; i > -1; i--){
      if(tourneysSlice[i] === tournament){
        tourneysSlice.splice(i,1);
      }
    }
    // the sorting for the tournament table should happen on game submits,
      // so that means the first item in the currentTournamentTable array
      // should be the winner of our tournament when we end it!
    var winner = this.state.currentTournamentTable.shift();

    // grab the tournament we are in from the state,
    // set the winner for the tournament based on the winner's id
    tournament.winner_id = winner.username;

    db.ref(tourneysRef + '/' + tournament.tourneyId).set(tournament);
    alert('Congratulations to ' + winner.username + ' for winning the ' + tournament.tourneyName + ' tournament!');

    // That results object will be passed into the put request to the server.
    // axios.put('/api/tournaments', tournament)
    //   .then(function(response) {
    //     // This (untested) alert definitely doesnt work right now, but is a place holder for some sort of
    //       // Congradulations to the winner.




        // Then we set our currentTournament back to null to go back to the create tournament page.
      self.setState({
        currentTournament: null,
        allPlayersList: uniquePlayas,
        tourneyPlayersList: [],
        ongoingTournamentsList: tourneysSlice,
        currentTournamentTable: []
      });

      // })
      // .then(res => {
        // utils.getOngoingTournaments()
        //   .then(function(tourneys) {

          // });
      // })
      // .catch(function(err) {
      //   // A catch in the event the put request fails.
      //   console.log('FinishTournament Error:', err);
      // });
  }

//GameStatsForm calls this function after it has PUT the entered stats in the database.
  updateGames(tourneyId, callback) {
    var standingsArray = [];
    console.log('tourneyId in update games:',tourneyId);
    var self = this;
    db.ref(tourneysRef + tourneyId).once('value').then(function(snapshot) {
      var data = snapshot.val();
      console.log('tournament data in update games:', data );
      var organizedGames = data.games.reduce(function(prevGame, currGame) {
        prevGame[currGame.status] ? prevGame[currGame.status].push(currGame) : prevGame[currGame.status] = [currGame];
        return prevGame;
      }, {});
      var firstUnplayed;
      if (!organizedGames.created) {
        firstUnplayed = null;
      } else {
        firstUnplayed = organizedGames.active ? organizedGames.active[0] : organizedGames.created[0] || null;
      }

      // Then we take the first game from the active list (if we have one), otherwise we take the first game from the Created list

      self.setState({
        currentTournamentGames: data.games,
        currentGame: firstUnplayed,
        tourneyPlayersList: data.players,
        currentTournamentTable: data.players
      });
      var currGame = self.state.currentGame;
      //here
      var standingsObj = data.games.filter(game =>
        game.player1_score !== null
      ).reduce(function(standings, currGame) {
        // collect the player ids for this game
        var p1 = currGame.player1_id;
        var p2 = currGame.player2_id;

        // If player 1 and player 2 already have keys on the standings object, increment their games played.
          // Otherwise create the new stats object and count the first game.
        standings[p1] ? standings[p1].gp++ : standings[p1] = {gp: 1, win: 0, loss: 0, draw: 0, gd: 0, points: 0};
        standings[p2] ? standings[p2].gp++ : standings[p2] = {gp: 1, win: 0, loss: 0, draw: 0, gd: 0, points: 0};

        // Collect the scores for each player for this game.
        var p1Score = currGame.player1_score;
        var p2Score = currGame.player2_score;

        // Using Math.abs gives us a positive number always, we add this to the winner's Goal Differential,
          // and subtract it from the loser's GD
        var goalDiff = Math.abs(p1Score - p2Score);

        // This monstrosity of a nested ternary operation handles the accumulation of points and wins/losses/draws
          // First it checks if the game was a draw, if it was we have all the info we need to finish setting everything.
        p1Score === p2Score ? (
          standings[p1].draw++, standings[p2].draw++, standings[p1].points += 1, standings[p2].points += 1
          // If the game wasn't a draw, we go about finding a winner and setting the data we need.
        ) : p1Score > p2Score ? (
          standings[p1].win++, standings[p2].loss++, standings[p1].points += 3, standings[p1].gd += goalDiff, standings[p2].gd -= goalDiff
        ) : (
          standings[p2].win++, standings[p1].loss++, standings[p2].points += 3, standings[p1].gd -= goalDiff, standings[p2].gd += goalDiff
        );

        return standings;
      }, {});

      // var idString = '';
      //
      // for (key in standingsObj) {
      //   idString += ('-' + key);
      // }

    // getAllPlayers function was made to accept a query string from a put request.
      // So we need to convert our array of player ids into a string with each
      // id separated by a '-' (dash).
      var playersWithStats = this.state[currentPlayersList];
      data.players.forEach(player => {
          standingsObj[player.uid].name = player.username;
          standingsObj[player.uid].playerId = player.uid;
          standingsArray.push(standingsObj[player.uid]);
          var index = playersWithStats.indexOf(player);
          if(index !== -1){
            playersWithStats[index].playerStats = standingsObj[player.uid];
          }
        });
        if (currentPlayersList === 'allFifaPlayersList') {
          this.setState({
            allFifaPlayersList: playersWithStats
          });
        } else {
          this.setState({
            allPongPlayersList: playersWithStats
          });
        }

        console.log(standingsArray);

      });
      return standingsArray;

  }

    // });
  //   var table = res.data.sort(function(prevPlayer, currentPlayer) {
  //     return prevPlayer.points === currentPlayer.points ? currentPlayer.gd - prevPlayer.gd : currentPlayer.points - prevPlayer.points;
  //   });
  //
  //   utils.getGamesByTourneyId(tourneyId).then(res => {
  //     self.setState({
  //       currentTournamentGames: res.games,
  //       currentGame: res.nextGame
  //     });
  //   }).then(res =>{
  //     utils.getTableForTourney(tourneyId)
  //       .then(res => {
  //         self.setState({
  //           currentTournamentTable: res
  //         });
  //       })
  //       .catch(err => {
  //         throw err;
  //       });
  //   }).then(res => {
  //     typeof callback === 'function' ? callback(tourneyId, self) : '';
  //   });
  // }

  updatePlayers(tourneyId, context) {
    // After setting the games, we will also want to reset the players so that they are displayed correctly when we set a new currentTournament
    // Slight change here, by adding a dictionary we can make this process O(n) instead of O(2^n).
    var dictionary = {};
    // The dictionary gives us a constant/instant time to check if the id is in the unique id list.
    // This lets us filter down to unique ids without nesting .includes or .indexOf.
    var uniquePlayerIds = [];

    // Here we iterate over the array of game objects to filter them down to unique IDs
    context.state.currentTournamentGames.forEach(function(game) {
      if (dictionary[game.player1_id] === undefined) {
        uniquePlayerIds.push(game.player1_id);
      }
      dictionary[game.player1_id] = 'found';

      if (dictionary[game.player2_id] === undefined) {
        uniquePlayerIds.push(game.player2_id);
      }
      dictionary[game.player2_id] = 'found';

    });//TODO NOTE finish

    // var idsString = uniquePlayerIds.join('-');

    // axios.get('./api/player', {
    //   params: {
    //     tournament_players: idsString
    //   }
    // })
    // .then(function(playersInCurrentTourney) {
      // context.setState({
      //   tourneyPlayersList: playersInCurrentTourney.data,
      // });
    // });
  }


  render() {
    // if the pong stats view is enabled
      if(this.state.pongStatsView){
        return (
        <div className="pong">
          <nav className="navbar navbar-inverse">
            <div className="navbar-header">
              <a className="navbar-brand" href="#">PING PONG TOURNAMENT MANAGER</a>
            </div>
            <ul className="nav navbar-nav">
              <li><a href="#"><span onClick={this.togglePongStatsView.bind(this)} >Home</span></a></li>
              <li><a href="#"><span>Stats</span></a></li>
            </ul>
          </nav>
          <div className="container">
            <div className="jumbotron header">
              <h1>VIEW YOUR STATS!</h1>
              <p>
                Check out the lifetime stats of all your added players!
              </p>
            </div>

          </div>

          <div className="row">
            <div className="col-xs-12">
                <h3>.</h3>
                <h3>.</h3>
            </div>
          </div>


          <div className="row">

            <div className="col-xs-1">

            </div>

            <div className="col-xs-10">
              <PongStatsTable table={this.state.allPongPlayersList} />
            </div>

            <div className="col-xs-1">

            </div>
          </div>
          <div className="well"></div>
          <div className="row">
            <div className="col-xs-2"></div>
            <div className="col-xs-8">
              <div className="panel panel-default">
                <div className="panel-body">
                  <h1 className="fin">
                    <ul className="nav navbar-foot">
                      <li><a href="#"><span onClick={this.toggleBoth.bind(this)}>FIFA</span></a></li>
                      <li><a href="#"><span>PING PONG</span></a></li>
                    </ul>
                  </h1>
                </div>
              </div>
            </div>
            <div className="col-xs-2"></div>
          </div>
        </div>
      )
    }
    // if the pong view is enabled
    else if(this.state.pongView) {
      if(this.state.currentTournament) {
        return (
        <div className="pong">
          <nav className="navbar navbar-inverse">
            <div className="navbar-header">
              <a className="navbar-brand" href="#">PING PONG TOURNAMENT MANAGER</a>
            </div>
            <ul className="nav navbar-nav">
              <li><a href="/"><span>Home</span></a></li>
              <li><a href="#"><span onClick={this.togglePongStatsView.bind(this)}>Stats</span></a></li>
            </ul>
          </nav>
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
            <div className="col-xs-12"></div>
          </div>

          <div className="row">

            <div className="col-xs-1">

            </div>

            <div className="col-xs-5">
              <CurrentTournament tourney={this.state} updateGames={this.updateGames.bind(this)} setCurrentGame={this.setCurrentGame.bind(this)}/>
            </div>

            <div className="col-xs-5">
              <StatsTable playersList={this.state.tourneyPlayersList} table={this.state.currentTournamentTable} />
            </div>

            <div className="col-xs-1">

            </div>
          </div>
          <div className="well"></div>
          <div className="row">
            <div className="col-xs-2"></div>
            <div className="col-xs-8">
              <div className="panel panel-default">
                <div className="panel-body">
                  <h1 className="fin">
                    <ul className="nav navbar-foot">
                      <li><a href="#"><span onClick={this.togglePongView.bind(this)}>FIFA</span></a></li>
                      <li><a href="#"><span>PING PONG</span></a></li>
                    </ul>
                  </h1>
                </div>
              </div>
            </div>
            <div className="col-xs-2"></div>
          </div>
        </div>
      )
      }else{
      return (
        <div className="pong">
          <nav className="navbar navbar-inverse">
            <div className="navbar-header">
              <a className="navbar-brand" href="#">PING PONG TOURNAMENT MANAGER</a>
            </div>
            <ul className="nav navbar-nav">
              <li><a href="#"><span>Home</span></a></li>
              <li><a href="#"><span onClick={this.togglePongStatsView.bind(this)}>Stats</span></a></li>
            </ul>
            <div className='loginBar'>
              <Login />
            </div>
          </nav>

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
                <AddPlayerForm parentState={this.state} addPlayer={this.addPlayer.bind(this)} />
            </div>
            <div className="col-xs-7"></div>
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
                  <StartTournament createTournament={this.createTournament.bind(this)}/>
                  <NewTournamentPlayers players={this.state.tourneyPlayersList} click={this.movePlayer.bind(this)} />
                </div>
              </div>
              <OngoingTournamentsList tourneys={this.state[currentTourneyList]} click={this.setCurrentTournament.bind(this)}/>
            </div>

            <div className="col-xs-5">
              {/* this will render out with the existing players in the database, and ones added through the form */}
              <AllPlayersList players={this.state[currentPlayersList]} click={this.movePlayer.bind(this)}/>
            </div>

            <div className="col-xs-1">
            </div>
          </div>
          <div className="well"></div>
          <div className="row">
            <div className="col-xs-2"></div>
            <div className="col-xs-8">
              <div className="panel panel-default">
                <div className="panel-body">
                  <h1 className="fin">
                    <ul className="nav navbar-foot">
                      <li><a href="#"><span onClick={this.togglePongView.bind(this)} >FIFA</span></a></li>
                      <li><a href="#"><span>PING PONG</span></a></li>
                    </ul>
                  </h1>
                </div>
              </div>
            </div>
            <div className="col-xs-2"></div>
          </div>
        </div>
        )
    }
  }

    else if(this.state.statsView) {
      return (
        <div className="background">
          <nav className="navbar navbar-inverse">
            <div className="navbar-header">
              <a className="navbar-brand" href="#">FIFA TOURNAMENT MANAGER</a>
            </div>
            <ul className="nav navbar-nav">
              <li><a href="#"><span onClick={this.toggleStatsView.bind(this)} >Home</span></a></li>
              <li><a href="#"><span>Stats</span></a></li>
            </ul>
          </nav>
          <div className="container">
            <div className="jumbotron header">
              <h1>VIEW YOUR STATS!</h1>
              <p>
                Check out the lifetime stats of all your added players!
              </p>
            </div>

          </div>

          <div className="row">
            <div className="col-xs-12">
                <h3>.</h3>
                <h3>.</h3>
            </div>
          </div>


          <div className="row">

            <div className="col-xs-1">

            </div>

            <div className="col-xs-10">
              <StatsTable table={this.state.allFifaPlayersList} />
            </div>

            <div className="col-xs-1">

            </div>
          </div>
          <div className="well"></div>
          <div className="row">
            <div className="col-xs-2"></div>
            <div className="col-xs-8">
              <div className="panel panel-default">
                <div className="panel-body">
                  <h1 className="fin">
                    <ul className="nav navbar-foot">
                      <li><a href="#"><span>FIFA</span></a></li>
                      <li><a href="#"><span onClick={this.toggleBoth.bind(this)}>PING PONG</span></a></li>
                    </ul>
                  </h1>
                </div>
              </div>
            </div>
            <div className="col-xs-2"></div>
          </div>
        </div>
      );
    } else if (this.state.currentTournament) {
      // render the CurrentTournament app
      return (
        <div className="background">
          <nav className="navbar navbar-inverse">
            <div className="navbar-header">
              <a className="navbar-brand" href="#">FIFA TOURNAMENT MANAGER</a>
            </div>
            <ul className="nav navbar-nav">
              <li><a href="/"><span>Home</span></a></li>
              <li><a href="#"><span onClick={this.toggleStatsView.bind(this)}>Stats</span></a></li>
            </ul>
          </nav>
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
            <div className="col-xs-12"></div>
          </div>

          <div className="row">

            <div className="col-xs-1">

            </div>

            <div className="col-xs-5">
              <CurrentTournament tourney={this.state} updateGames={this.updateGames.bind(this)} setCurrentGame={this.setCurrentGame.bind(this)}/>
            </div>

            <div className="col-xs-5">
              <StatsTable playersList={this.state.tourneyPlayersList} table={this.state.currentTournamentTable} />
            </div>

            <div className="col-xs-1">

            </div>
          </div>
          <div className="well"></div>
          <div className="row">
            <div className="col-xs-2"></div>
            <div className="col-xs-8">
              <div className="panel panel-default">
                <div className="panel-body">
                  <h1 className="fin">
                    <ul className="nav navbar-foot">
                      <li><a href="#"><span>FIFA</span></a></li>
                      <li><a href="#"><span onClick={this.togglePongView.bind(this)}>PING PONG</span></a></li>
                    </ul>
                  </h1>
                </div>
              </div>
            </div>
            <div className="col-xs-2"></div>
          </div>
        </div>
      );
    } else {
      // otherwise render the create tournament app.
      return (
        <div className="background">
          <nav className="navbar navbar-inverse">
            <div className="navbar-header">
              <a className="navbar-brand" href="#">FIFA TOURNAMENT MANAGER</a>
            </div>
            <ul className="nav navbar-nav">
              <li><a href="#"><span>Home</span></a></li>
              <li><a href="#"><span onClick={this.toggleStatsView.bind(this)}>Stats</span></a></li>
            </ul>
            <div className='loginBar'>
              <Login />
            </div>
          </nav>

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
                <AddPlayerForm parentState={this.state} addPlayer={this.addPlayer.bind(this)} />
            </div>
            <div className="col-xs-7"></div>
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
                  <StartTournament createTournament={this.createTournament.bind(this)}/>
                  <NewTournamentPlayers players={this.state.tourneyPlayersList} click={this.movePlayer.bind(this)} />
                </div>
              </div>
              <OngoingTournamentsList tourneys={this.state[currentTourneyList]} click={this.setCurrentTournament.bind(this)}/>
            </div>

            <div className="col-xs-5">
              {/* this will render out with the existing players in the database, and ones added through the form */}
              <AllPlayersList players={this.state[currentPlayersList]} click={this.movePlayer.bind(this)}/>
            </div>

            <div className="col-xs-1">
            </div>
          </div>
          <div className="well"></div>
          <div className="row">
            <div className="col-xs-2"></div>
            <div className="col-xs-8">
              <div className="panel panel-default">
                <div className="panel-body">
                  <h1 className="fin">
                    <ul className="nav navbar-foot">
                      <li><a href="#"><span>FIFA</span></a></li>
                      <li><a href="#"><span onClick={this.togglePongView.bind(this)}>PING PONG</span></a></li>
                    </ul>
                  </h1>
                </div>
              </div>
            </div>
            <div className="col-xs-2"></div>
          </div>
        </div>
      );
    }
  }

}

module.exports = Main;
