// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

/**
 * @dev Encode (without '=' padding) 
 * @author evmbrahmin, adapted from hiromin's Base64URL libraries
 */
library Base64Url {
    /**
     * @dev Base64Url Encoding Table
     */
    string internal constant ENCODING_TABLE =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

    function encode(bytes memory data) internal pure returns (string memory) {
        if (data.length == 0) return "";

        // Load the table into memory
        string memory table = ENCODING_TABLE;

        string memory result = new string(4 * ((data.length + 2) / 3));

        // @solidity memory-safe-assembly
        assembly {
            let tablePtr := add(table, 1)
            let resultPtr := add(result, 32)

            for {
                let dataPtr := data
                let endPtr := add(data, mload(data))
            } lt(dataPtr, endPtr) {

            } {
                dataPtr := add(dataPtr, 3)
                let input := mload(dataPtr)

                mstore8(
                    resultPtr,
                    mload(add(tablePtr, and(shr(18, input), 0x3F)))
                )
                resultPtr := add(resultPtr, 1)

                mstore8(
                    resultPtr,
                    mload(add(tablePtr, and(shr(12, input), 0x3F)))
                )
                resultPtr := add(resultPtr, 1)

                mstore8(
                    resultPtr,
                    mload(add(tablePtr, and(shr(6, input), 0x3F)))
                )
                resultPtr := add(resultPtr, 1)

                mstore8(resultPtr, mload(add(tablePtr, and(input, 0x3F))))
                resultPtr := add(resultPtr, 1)
            }

            // Remove the padding adjustment logic
            switch mod(mload(data), 3)
            case 1 {
                // Adjust for the last byte of data
                resultPtr := sub(resultPtr, 2)
            }
            case 2 {
                // Adjust for the last two bytes of data
                resultPtr := sub(resultPtr, 1)
            }
            
            // Set the correct length of the result string
            mstore(result, sub(resultPtr, add(result, 32)))
        }

        return result;  
    }
}
