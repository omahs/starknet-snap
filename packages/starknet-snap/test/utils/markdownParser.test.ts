import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import { markDownParserInstance, BoldParser, ItalicizedParser, StrikeParser, InlineParser } from '../../src/utils/markdownParser';

chai.use(sinonChai);

describe('Test function: MarkDownParser', function () {
    const formatter = markDownParserInstance;

    beforeEach(async function () {

    });

    afterEach(function () {
    });


    describe('Test markdown: BoldParser', function () {
        const parser = new BoldParser()
        it('do nothing',  function () {
            const text = parser.apply('pure text');
            expect(text).to.be.eql('pure text');
        });
        it('remove bold',  function () {
            const text = parser.apply('this is text**bold**__bold__');
            expect(text).to.be.eql('this is textboldbold');
        });
        it('ignore single bold indicator',  function () {
            const text = parser.apply('__this is text**bold**__bold__');
            expect(text).to.be.eql('this is textboldbold__');
        });
    })

    describe('Test markdown: ItalicizedParser', function () {
        const parser = new ItalicizedParser()
        it('do nothing',  function () {
            const text = parser.apply('pure text');
            expect(text).to.be.eql('pure text');
        });
        it('remove italicized',  function () {
            const text = parser.apply('_italicized_ this is text*italicized*');
            expect(text).to.be.eql('italicized this is textitalicized');
        });
        it('ignore single italicized indicator',  function () {
            let text = parser.apply('_this is text*italicized*_italicized_');
            expect(text).to.be.eql('this is textitalicizeditalicized_');
            text = parser.apply('_*italicized*this is text_italicized_');
            expect(text).to.be.eql('italicizedthis is textitalicized_');
        });
    })
    describe('Test markdown: StrikeParser', function () {
        const parser = new StrikeParser()
        it('do nothing',  function () {
            const text = parser.apply('pure text');
            expect(text).to.be.eql('pure text');
        });
        it('remove strike',  function () {
            const text = parser.apply('this is text~~strike~~');
            expect(text).to.be.eql('this is textstrike');
        });
        it('ignore single strike indicator',  function () {
            const text = parser.apply('~~~this is textstrike~~strike~~');
            expect(text).to.be.eql('~this is textstrikestrike~~');
        });
    })
    describe('Test markdown: InlineParser', function () {
        const parser = new InlineParser()
        it('do nothing',  function () {
            const text = parser.apply('pure text');
            expect(text).to.be.eql('pure text');
        });
        it('remove inline',  function () {
            const text = parser.apply('this is text`inline`');
            expect(text).to.be.eql('this is textinline');
        });
        it('ignore single inline indicator',  function () {
            const text = parser.apply('```this is text`inline`');
            expect(text).to.be.eql('`this is textinline');
        });
    })
    
    

});
