// await window.ethereum.enable();

App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  hasVoted: false,


  init: function() {
    return App.initWeb3();
  },

  initWeb3: async function () {
    // TODO: refactor conditional
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = window.ethereum;
      // UPDATED FOR 2022
      await window.ethereum.request({method: 'eth_requestAccounts'});

      console.log(App);
      web3 = new Web3(window.ethereum);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: function() {
    $.getJSON("Election.json", function(election) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Election = TruffleContract(election);
      // Connect provider to interact with contract
      App.contracts.Election.setProvider(App.web3Provider);

      App.listenForEvents();

      return App.render();
    });
  },

  // Listen for events emitted from the contract
  listenForEvents: function() {
    App.contracts.Election.deployed().then(function(instance) {
      // Restart Chrome if you are unable to receive this event
      // This is a known issue with Metamask
      // https://github.com/MetaMask/metamask-extension/issues/2393
      instance.votedEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event)
        // Reload when a new vote is recorded
        App.render();
      });
    });
  },

  render: function() {
    var electionInstance;
    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });

    // Load contract data
    App.contracts.Election.deployed().then(function(instance) {
      electionInstance = instance;
      return electionInstance.candidatesCount();
    }).then(function(candidatesCount) {
      console.log("CANDIDATE COUNT: " + candidatesCount);
      var candidatesResults = $("#candidatesResults");
      candidatesResults.empty();

      var candidatesSelect = $('#candidatesSelect');
      candidatesSelect.empty();

      for (var i = 1; i <= candidatesCount; i++) {
        electionInstance.candidates(i).then(function(candidate) {
          var id = candidate[0];
          var name = candidate[1];
          var voteCount = candidate[2];
          console.log("Appending Candidate")

          // Render candidate Result
          var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>"
          candidatesResults.append(candidateTemplate);

          // Render candidate ballot option
          var candidateOption = "<option value='" + id + "' >" + name + "</option>"
          candidatesSelect.append(candidateOption);
        });
      }
      return electionInstance.voters(App.account);
    }).then(function(hasVoted) {
      // Do not allow a user to vote
      if(hasVoted) {
        $('#voteForm').hide();
      }else if(!hasVoted){
        $('#alreadyVotedText').hide();
      }

      loader.hide();
      content.show();
      return electionInstance.electionOwner();
    }).then(function (electionOwner){
      if (electionOwner === App.account){
        $('#voteForm').hide();
        $('#accountAddress').append("<p>Election owner</p>")
      }else{
        $('#electionOwnerContainer').hide();
        electionInstance.isOpened().then(function (isOpened){
          if (isOpened != 2){
            $('#voteForm').hide();
          }
        });
      }
      return electionInstance.isOpened();
    }).then(function (isOpened){
      if ((isOpened ==0)){
        // Election closed state
        $('#closeElectionButton').hide();
        $('#pauseElectionButton').hide();
        $('#electionStatus').append("<p>Election closed</p>");
      }else if (isOpened == 1){
        // Election paused state
        $('#pauseElectionButton').hide();
        $('#electionStatus').append("<p>Election paused</p>");
      }
      else if (isOpened == 2){
        // Election opened state
        $('#openElectionButton').hide();
        $('#closeElectionButton').hide();
        $('#electionStatus').append("<p>Election opened</p>");
      }
      return electionInstance.lastWinningCandidate();
    }).then(function (winner){
      console.log(winner)
      $('#electionStatus').append(`<p>Latest Winner: ${winner}</p>`);
    }).catch(function(error) {
      console.warn(error);
    });
  },

  castVote: function() {
    var candidateId = $('#candidatesSelect').val();
    App.contracts.Election.deployed().then(function(instance) {
      return instance.vote(candidateId, { from: App.account });
    }).then(function(result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
    });
  },

  openElection: function() {
    App.contracts.Election.deployed().then(function(instance) {
      return instance.openElection({ from: App.account });
    }).then(function(result) {
      App.render();
    }).catch(function(err) {
      console.error(err);
    });
  },

  pauseElection: function() {
    App.contracts.Election.deployed().then(function(instance) {
      return instance.pauseElection({ from: App.account });
    }).then(function(result) {
      App.render();
    }).catch(function(err) {
      console.error(err);
    });
  },

closeElection: function() {
  App.contracts.Election.deployed().then(function(instance) {
    return instance.closeElection({ from: App.account });
  }).then(function(result) {
    App.render();
  }).catch(function(err) {
    console.error(err);
  });
}
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
