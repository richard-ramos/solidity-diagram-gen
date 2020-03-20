import parser from 'solidity-parser-antlr'

describe.skip('Solidity Parser', () => {
  test('pragma ^0.5', () => {
    expect.assertions(1)
    try {
      const node = parser.parse('pragma solidity ^0.5;', {})
      expect(node).toBeDefined()
    } catch (err) {
      console.error(err)
    }
  })
})
