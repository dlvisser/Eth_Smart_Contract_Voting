// SPDX-License-Identifier: MIT
pragma solidity 0.8.5;

/*
This is the Election Smart Contract made by Dave Visser, it is a first try at blockchain programming.

What can it do: 

1. Create a list of candidates up for election.
2. The owner of the election can start, stop and pause an election.
3. When the owner stops an election a winner get's chosen.
4. Owner cannot vote.
5. Only people with a metamask account can vote.
6. Voting can only happen when election is in open state.
*/
contract Election {

    // Model a Candidate
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    // Election Owner
    address public electionOwner;
    // Election started by Owner
    uint public isOpened = 0;
    // Store accounts that have voted
    mapping(address => bool) public voters;
    // Fetch Candidate
    mapping(uint => Candidate) public candidates;
    // Store Candidates Count
    uint public candidatesCount;
    // Store previous winning candidate
    string public lastWinningCandidate = "No winners ever";

    // Voted event
    event VotedEvent (
        uint indexed _candidateId
    );

    // Notify state has changed
    event ChangedEventState (
        string _isOpened
    );

    // Print the winner of the election
    event WinnerPrinted(
        string _winningCandidate
    );

    constructor() {
        electionOwner = msg.sender;
        addCandidate("Bitcoin club");
        addCandidate("Ethereum club");
        addCandidate("Solana club");
    }

    // Store Candidates
    function addCandidate (string memory _name) private {
        candidatesCount ++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
    }

    function openElection() public{
        // require that user requesting is also the owner of the contract
        require(electionOwner == msg.sender);

        isOpened = 2;

        emit ChangedEventState("Opened");
    }

    function pauseElection() public{
        // require that user requesting is also the owner of the contract
        require(electionOwner == msg.sender);

        isOpened = 1;

        emit ChangedEventState("Paused");
    }

    function closeElection() public{
        // require that user requesting is also the owner of the contract
        require(electionOwner == msg.sender);

        isOpened = 0;

        emit ChangedEventState("Closed");

        // Show the winning candidate
        winningCandidate();
    }

    function winningCandidate() public{
        string memory _winningCandidate = "";
        uint winningVoteCount = 0;
        for (uint candidate = 0; candidate < candidatesCount; candidate++){
            if(candidates[candidate].voteCount > winningVoteCount){
                winningVoteCount = candidates[candidate].voteCount;
                _winningCandidate = candidates[candidate].name;
            }
        }

        if(winningVoteCount == 0){
            _winningCandidate = "No candidate won";
        }

        lastWinningCandidate = _winningCandidate;
        emit WinnerPrinted(_winningCandidate);
    }

    function vote (uint _candidateId) public {
        // require that the election is opened
        require(isOpened == 2, "The election is not opened");

        // require election owner may not vote
        require(msg.sender != electionOwner, "The election owner is not allowed to vote");

        // require that they haven't voted before
        require(!voters[msg.sender], "This address has already voted once");

        // require a valid candidate
        require(_candidateId > 0 && _candidateId <= candidatesCount, "The selected candidate does not exist");

        // record that voter has voted
        voters[msg.sender] = true;

        // update candidate vote Count
        candidates[_candidateId].voteCount ++;

        // trigger voted event
        emit VotedEvent(_candidateId);
    }
}
