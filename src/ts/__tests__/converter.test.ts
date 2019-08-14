

import { readFile } from 'fs'
import { convertDot2Svg, writeSVG } from '../converter'

describe('Converter', () => {

    test('convert a valid dot to svg', (done) => {

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
})
