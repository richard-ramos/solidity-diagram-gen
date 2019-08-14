
import { getSolidityFilesFromFolderOrFile, parseSolidityFile } from '../parser'
import { UmlClass } from '../umlClass'

describe('Parser', () => {

    describe('getSolidityFilesFromFolderOrFile', () => {
        test('get Solidity files from contracts folder', async() => {
            const files = await getSolidityFilesFromFolderOrFile('./src/contracts')
            expect(files).toHaveLength(12)
        })

        test('get Solidity files from folder with no sol files', async() => {
            const files = await getSolidityFilesFromFolderOrFile('./src/ts')
            expect(files).toHaveLength(0)
        })

        test('get Solidity file', async() => {
            const files = await getSolidityFilesFromFolderOrFile('./src/contracts/Caller.sol')
            expect(files).toHaveLength(1)
        })

        test('get Solidity files including Open Zeppelin', async() => {
            const files = await getSolidityFilesFromFolderOrFile('.')
            expect(files).toHaveLength(87)
        })

        describe('Failures', () => {
            test('Reading a file that doesn\'t exist', async() => {
                expect.assertions(1)

                try {
                    await getSolidityFilesFromFolderOrFile('./FleDoesNotExist.sol')
                }
                catch (err) {
                    expect(err.message).toMatch(/No such file or folder/)
                }
            })

            test('Reading a file that doesn\'t have a sol extension', async() => {
                expect.assertions(1)

                try {
                    await getSolidityFilesFromFolderOrFile('./package.json')
                }
                catch (err) {
                    expect(err.message).toMatch(/does not have a .sol extension/)
                }
            })
        })
    })

    describe('parseSolidityFile', () => {

        test('SomeImpl', async() => {
            const files = await getSolidityFilesFromFolderOrFile('./src/contracts/SomeImpl.sol')

            const umlClasses = parseSolidityFile(files[0])
            expect(umlClasses).toBeInstanceOf(Array)
            expect(umlClasses[0]).toBeInstanceOf(UmlClass)
            expect(umlClasses[0].attributes).toHaveLength(21)
            expect(umlClasses[0].operators).toHaveLength(15)

            expect(Object.keys(umlClasses[0].structs)).toHaveLength(3)
            expect(Object.keys(umlClasses[0].enums)).toHaveLength(2)
        })

        test('Caller', async() => {
            const files = await getSolidityFilesFromFolderOrFile('./src/contracts/Caller.sol')

            const umlClasses = parseSolidityFile(files[0])
            expect(umlClasses).toBeInstanceOf(Array)
            expect(umlClasses[0]).toBeInstanceOf(UmlClass)
            expect(umlClasses).toHaveLength(1)
        })

        test('SomeInterface', async() => {
            const files = await getSolidityFilesFromFolderOrFile('./src/contracts/SomeInterface.sol')

            const umlClasses = parseSolidityFile(files[0])
            expect(umlClasses).toBeInstanceOf(Array)
            expect(umlClasses[0]).toBeInstanceOf(UmlClass)
            expect(umlClasses).toHaveLength(1)
        })
    })
})
