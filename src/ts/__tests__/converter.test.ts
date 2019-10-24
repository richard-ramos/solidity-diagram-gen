

import { readFile } from 'fs'
import { convertUmlClassesToSvg, convertDot2Svg, EtherscanParser, writeSVG } from '../index'

const etherDelta = '0x8d12A197cB00D4747a1fe03395095ce2A5CC6819'
const etherscanKey = 'HPD85TXCG1HW3N5G6JJXK1A7EE5K86CYBJ'

describe('Converter', () => {

    test('generateFilesFromUmlClasses a valid dot to svg', (done) => {

        readFile('./src/ts/__tests__/SomeImpl.dot', (err, dotBuf) => {
            if (err) {
                throw err;
            }

            const dotString = dotBuf.toString('utf8')
            const svg = convertDot2Svg(dotString)
            expect(typeof svg).toEqual('string')
            expect(svg.length).toBeGreaterThan(2000)

            done()
        });
    })

    test('writeSVG with invalid dot', () => {

        const dot = ''
        writeSVG(dot, 'converterTest')
    })

    test('Parse EtherDelta from Etherscan and convert to svg string', async() => {

        const etherscan = new EtherscanParser(etherscanKey)

        const umlClasses = await etherscan.getUmlClasses(etherDelta)

        const svg = await convertUmlClassesToSvg(umlClasses)

        expect(svg).toMatch(/xml version/)
        expect(svg).toMatch(/DOCTYPE svg PUBLIC/)
        expect(svg).toMatch(/ReserveToken/)
        expect(svg).toMatch(/EtherDelta/)
    }, 10000)
})
