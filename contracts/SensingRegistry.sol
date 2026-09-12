// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SensingRegistry {
    struct SensingRecord {
        uint256 id;
        address submitter;
        string dataHash;
        string metadataURI;
        uint256 confidenceScore;
        uint256 timestamp;
    }

    uint256 private nextRecordId = 1;
    mapping(uint256 => SensingRecord) private records;
    mapping(address => uint256[]) private recordIdsBySubmitter;

    event SensingDataSubmitted(
        uint256 indexed recordId,
        address indexed submitter,
        string dataHash,
        string metadataURI,
        uint256 confidenceScore,
        uint256 timestamp
    );

    function submitData(
        string calldata dataHash,
        string calldata metadataURI,
        uint256 confidenceScore
    ) external returns (uint256 recordId) {
        require(bytes(dataHash).length > 0, "dataHash is required");
        require(confidenceScore <= 100, "confidenceScore must be 0-100");

        recordId = nextRecordId;
        nextRecordId += 1;

        records[recordId] = SensingRecord({
            id: recordId,
            submitter: msg.sender,
            dataHash: dataHash,
            metadataURI: metadataURI,
            confidenceScore: confidenceScore,
            timestamp: block.timestamp
        });

        recordIdsBySubmitter[msg.sender].push(recordId);

        emit SensingDataSubmitted(
            recordId,
            msg.sender,
            dataHash,
            metadataURI,
            confidenceScore,
            block.timestamp
        );
    }

    function getRecord(uint256 recordId) external view returns (SensingRecord memory) {
        require(records[recordId].timestamp != 0, "record not found");
        return records[recordId];
    }

    function getRecordIdsBySubmitter(address submitter) external view returns (uint256[] memory) {
        return recordIdsBySubmitter[submitter];
    }

    function totalRecords() external view returns (uint256) {
        return nextRecordId - 1;
    }
}
