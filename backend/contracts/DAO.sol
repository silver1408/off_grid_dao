// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DAO {
    // ─────────────────────────────────────────────
    // STATE VARIABLES
    // ─────────────────────────────────────────────

    struct Proposal {
        uint256 id;
        string title;
        string description;
        address creator;
        uint256 createdAt;
        uint256 votesYes;
        uint256 votesNo;
        bool executed;
        uint256 fundsRequested;
    }

    struct Treasury {
        uint256 totalFunds;
        uint256 allocated;
        uint256 available;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted; // proposalId => voter => bool
    mapping(uint256 => mapping(address => string)) public votes; // proposalId => voter => "yes"/"no"

    uint256 public proposalCount = 0;
    address public owner;
    Treasury public treasury;

    // ─────────────────────────────────────────────
    // EVENTS
    // ─────────────────────────────────────────────

    event ProposalCreated(
        uint256 indexed proposalId,
        string title,
        address indexed creator,
        uint256 timestamp
    );

    event VoteCasted(
        uint256 indexed proposalId,
        address indexed voter,
        string vote,
        uint256 timestamp
    );

    event FundsTransferred(
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 timestamp
    );

    event FundsAllocated(
        uint256 indexed proposalId,
        uint256 amount,
        uint256 timestamp
    );

    event TreasuryUpdated(
        uint256 totalFunds,
        uint256 allocated,
        uint256 available
    );

    // ─────────────────────────────────────────────
    // MODIFIERS
    // ─────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    // ─────────────────────────────────────────────
    // CONSTRUCTOR
    // ─────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
        treasury = Treasury(0, 0, 0);
    }

    // ─────────────────────────────────────────────
    // TREASURY FUNCTIONS
    // ─────────────────────────────────────────────

    receive() external payable {
        treasury.totalFunds += msg.value;
        treasury.available = address(this).balance;
        emit TreasuryUpdated(
            treasury.totalFunds,
            treasury.allocated,
            treasury.available
        );
    }

    function getTreasuryBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // ─────────────────────────────────────────────
    // PROPOSAL FUNCTIONS
    // ─────────────────────────────────────────────

    function createProposal(
        string memory _title,
        string memory _description,
        uint256 _fundsRequested
    ) external returns (uint256) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");

        proposalCount += 1;
        uint256 proposalId = proposalCount;

        proposals[proposalId] = Proposal({
            id: proposalId,
            title: _title,
            description: _description,
            creator: msg.sender,
            createdAt: block.timestamp,
            votesYes: 0,
            votesNo: 0,
            executed: false,
            fundsRequested: _fundsRequested
        });

        emit ProposalCreated(proposalId, _title, msg.sender, block.timestamp);

        return proposalId;
    }

    function getProposal(uint256 _proposalId)
        external
        view
        returns (Proposal memory)
    {
        require(_proposalId > 0 && _proposalId <= proposalCount, "Invalid proposal ID");
        return proposals[_proposalId];
    }

    function getAllProposals() external view returns (Proposal[] memory) {
        Proposal[] memory result = new Proposal[](proposalCount);
        for (uint256 i = 1; i <= proposalCount; i++) {
            result[i - 1] = proposals[i];
        }
        return result;
    }

    // ─────────────────────────────────────────────
    // VOTING FUNCTIONS
    // ─────────────────────────────────────────────

    function vote(uint256 _proposalId, bool _voteYes) external {
        require(
            _proposalId > 0 && _proposalId <= proposalCount,
            "Invalid proposal ID"
        );
        require(
            !hasVoted[_proposalId][msg.sender],
            "You have already voted on this proposal"
        );

        Proposal storage proposal = proposals[_proposalId];
        require(!proposal.executed, "Proposal already executed");

        hasVoted[_proposalId][msg.sender] = true;

        if (_voteYes) {
            proposal.votesYes += 1;
            votes[_proposalId][msg.sender] = "yes";
        } else {
            proposal.votesNo += 1;
            votes[_proposalId][msg.sender] = "no";
        }

        emit VoteCasted(
            _proposalId,
            msg.sender,
            _voteYes ? "yes" : "no",
            block.timestamp
        );
    }

    function hasUserVoted(uint256 _proposalId, address _voter)
        external
        view
        returns (bool)
    {
        return hasVoted[_proposalId][_voter];
    }

    function getUserVote(uint256 _proposalId, address _voter)
        external
        view
        returns (string memory)
    {
        return votes[_proposalId][_voter];
    }

    // ─────────────────────────────────────────────
    // FUND TRANSFER FUNCTIONS
    // ─────────────────────────────────────────────

    function allocateFunds(uint256 _proposalId, uint256 _amount)
        external
        onlyOwner
    {
        require(
            _proposalId > 0 && _proposalId <= proposalCount,
            "Invalid proposal ID"
        );
        require(_amount > 0, "Amount must be greater than 0");
        require(
            address(this).balance >= _amount,
            "Insufficient contract balance"
        );

        treasury.allocated += _amount;
        treasury.available = address(this).balance - treasury.allocated;

        emit FundsAllocated(_proposalId, _amount, block.timestamp);
        emit TreasuryUpdated(
            treasury.totalFunds,
            treasury.allocated,
            treasury.available
        );
    }

    function transferFromTreasury(address payable _recipient, uint256 _amount)
        external
        onlyOwner
    {
        require(_recipient != address(0), "Invalid recipient address");
        require(_amount > 0, "Amount must be greater than 0");
        require(
            address(this).balance >= _amount,
            "Insufficient contract balance"
        );

        (bool success, ) = _recipient.call{value: _amount}("");
        require(success, "Transfer failed");

        emit FundsTransferred(address(this), _recipient, _amount, block.timestamp);
    }

    // ─────────────────────────────────────────────
    // ADMIN FUNCTIONS
    // ─────────────────────────────────────────────

    function executeProposal(uint256 _proposalId) external onlyOwner {
        require(
            _proposalId > 0 && _proposalId <= proposalCount,
            "Invalid proposal ID"
        );
        Proposal storage proposal = proposals[_proposalId];
        require(!proposal.executed, "Proposal already executed");

        proposal.executed = true;
    }

    function getTreasuryStatus()
        external
        view
        returns (
            uint256 _totalFunds,
            uint256 _allocated,
            uint256 _available
        )
    {
        return (
            treasury.totalFunds,
            treasury.allocated,
            address(this).balance
        );
    }
}
