var React = require('react');

var StatLine = (props) => {
  var stats = props.playerStats;
  // going to need data object to hold other stats like we had before
  return (

    <tr>
      <td>{stats.username}</td>
      <td>{stats.gp}</td>
      <td>{stats.won}</td>
      <td>{stats.draw}</td>
      <td>{stats.loss}</td>
      <td>{stats.gd}</td>
      <td>{stats.points}</td>
    </tr>
  );
};

module.exports = StatLine;

// <PongStatsTable table={this.state.allPongPlayersList} />
