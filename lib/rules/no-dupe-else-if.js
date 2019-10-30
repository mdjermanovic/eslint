/**
 * @fileoverview Rule to disallow duplicate conditions in if-else-if chains
 * @author Milos Djermanovic
 */

"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const astUtils = require("./utils/ast-utils");

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * Splits the give node by the `||` operator.
 * @param {ASTNode} node The node to split.
 * @returns {ASTNode[]} Array of conditions that makes the node when joined by `||`.
 */
function getOrConditions(node) {
    if (node.type === "LogicalExpression" && node.operator === "||") {
        return [...getOrConditions(node.left), ...getOrConditions(node.right)];
    }
    return [node];
}

/**
 * Creates an array with elements from the first given array that are not included in the second given array.
 * @param {Array} arrA The array to compare from.
 * @param {Array} arrB The array to compare against.
 * @param {Function} comparator A function to compare two elements, should return `true` if they are equal.
 * @returns {Array} a new array that represents `arrA \ arrB`.
 */
function getDifference(arrA, arrB, comparator) {
    return arrA.filter(a => !arrB.some(b => comparator(a, b)));
}

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
    meta: {
        type: "problem",

        docs: {
            description: "disallow duplicate conditions in if-else-if chains",
            category: "Possible Errors",
            recommended: false,
            url: "https://eslint.org/docs/rules/no-dupe-else-if"
        },

        schema: [],

        messages: {
            unexpected: "Duplicate condition in if-else-if chain."
        }
    },

    create(context) {
        const sourceCode = context.getSourceCode();

        /**
         * Determines whether the two given nodes have the equal tokens in the same order.
         * @param {ASTNode} left First node.
         * @param {ASTNode} right Second node.
         * @returns {boolean} `true` if the nodes have equal tokens.
         */
        function equalTokens(left, right) {
            return astUtils.equalTokens(left, right, sourceCode);
        }

        return {
            IfStatement(node) {
                let current = node,
                    nodeConditions = getOrConditions(node.test);

                while (current.parent && current.parent.type === "IfStatement" && current.parent.alternate === current) {
                    current = current.parent;
                    nodeConditions = getDifference(nodeConditions, getOrConditions(current.test), equalTokens);
                    if (nodeConditions.length === 0) {
                        context.report({ node: node.test, messageId: "unexpected" });
                        break;
                    }
                }
            }
        };
    }
};
