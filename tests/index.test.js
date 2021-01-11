/* eslint-disable */
'use strict'

const env = require('./env')
const create = require('../index').create

function findCssRuleAndDelete(selector) {
	const sheets = document.styleSheets

	for (let i = 0; i < sheets.length; i++) {
		const sheet = sheets[i]

		if (!sheet.cssRules) continue

		for (let j = 0; j < sheet.cssRules.length; j++) {
			const rule = sheet.cssRules[j]

			if (rule.selectorText === selector) {
				sheet.deleteRule(j)

				return rule
			}
		}
	}

	return null
}

describe('nano-css', function() {
	it('exists', function() {
		expect(typeof create).toBe('function')
	})

	it('can create renderer', function() {
		const nano = create()

		expect(typeof nano).toBe('object')
		expect(typeof nano.putRaw).toBe('function')
		expect(typeof nano.put).toBe('function')
	})

	it('default prefix is "_"', function() {
		expect(create().pfx).toBe('_')
	})

	it('default assign function is Object.assign', function() {
		expect(create().assign).toBe(Object.assign)
	})

	it('has no default hyperscript function', function() {
		expect(create().h).toBe(undefined)
	})

	it('can set configuration', function() {
		const assign = function() {
			return Object.assign.apply(Object, arguments)
		}
		const h = function() {}
		const stringify = function() {}
		const nano = create({
			pfx: 'hello-',
			h: h,
			assign: assign,
			stringify: stringify
		})

		expect(nano.pfx).toBe('hello-')
		expect(nano.h).toBe(h)
		expect(nano.assign).toBe(assign)
		expect(nano.stringify).toBe(stringify)
	})

	describe('.put()', function() {
		it('inserts CSS', function() {
			const nano = create()

			nano.put('.foo', {
				color: 'red'
			})

			if (env.isClient) {
				const rule = findCssRuleAndDelete('.foo')

				expect(typeof rule).toBe('object')
				expect(rule.style.color).toBe('red')
			}

			if (env.isServer) {
				expect(nano.raw.replace(/[\s\n]+/g, '')).toBe('.foo{color:red;}')
			}
		})

		it('puts many declarations', function() {
			const nano = create()

			nano.put('.foo2', {
				color: 'red',
				textDecoration: 'underline',
				'border-radius': '5px'
			})

			if (env.isClient) {
				const rule = findCssRuleAndDelete('.foo2')

				expect(typeof rule).toBe('object')
				expect(rule.style.color).toBe('red')
				expect(rule.style['text-decoration']).toBe('underline')
				expect(rule.style['border-radius']).toBe('5px')
			}

			if (env.isServer) {
				expect(nano.raw.includes('.foo2')).toBe(true)
				expect(nano.raw.includes('color:red')).toBe(true)
				expect(nano.raw.includes('text-decoration:underline')).toBe(true)
				expect(nano.raw.includes('border-radius:5px')).toBe(true)
			}
		})
		//
		it('supports nesting', function() {
			const nano = create()

			nano.put('.foo3', {
				'.nested': {
					color: 'blue'
				}
			})

			if (env.isClient) {
				const rule = findCssRuleAndDelete('.foo3 .nested')

				expect(typeof rule).toBe('object')
				expect(rule.style.color).toBe('blue')
			}

			if (env.isServer) {
				expect(nano.raw.includes('.foo3 .nested')).toBe(true)
				expect(nano.raw.includes('color:blue')).toBe(true)
			}
		})
		// //
		it('supports nesting - 2', function() {
			const renderer = create()

			renderer.put('.foo', {
				'.bar': {
					'.baz': {
						'.bazooka': {
							color: 'red'
						}
					}
				}
			})

			if (env.isClient) {
				const rule = findCssRuleAndDelete('.foo .bar .baz .bazooka')

				expect(typeof rule).toBe('object')
				expect(rule.style.color).toBe('red')
			}

			if (env.isServer) {
				expect(renderer.raw.indexOf('.foo .bar .baz .bazooka') > -1).toBe(true)
				expect(renderer.raw.indexOf('color') > -1).toBe(true)
				expect(renderer.raw.indexOf('red') > -1).toBe(true)
			}
		})

		it('supports pseudo selectors', function() {
			const nano = create()

			nano.put('.foo3', {
				':hover': {
					color: 'green'
				}
			})

			if (env.isClient) {
				const rule = findCssRuleAndDelete('.foo3:hover')

				expect(typeof rule).toBe('object')
				expect(rule.style.color).toBe('green')
			}

			if (env.isServer) {
				expect(nano.raw.includes('.foo3:hover')).toBe(true)
				expect(nano.raw.includes('color:green')).toBe(true)
			}
		})
		//
		it('can insert global styles', function() {
			const nano = create()
			nano.putRaw = jest.fn()

			nano.put('', {
				'.global': {
					color: 'green'
				}
			})

			if (env.isClient) {
				const rule = findCssRuleAndDelete('.global')
				expect(nano.putRaw.mock.calls[0][0].replace(/[\s\n]+/g, '')).toBe(
					'.global{color:green;}'
				)
			}

			if (env.isServer) {
				expect(nano.putRaw).toHaveBeenCalledTimes(1)
				expect(nano.putRaw.mock.calls[0][0].replace(/[\s\n]+/g, '')).toBe(
					'.global{color:green;}'
				)
			}
		})

		it('supports @media queries', function() {
			const nano = create()
			nano.putRaw = jest.fn()

			nano.put('.foo', {
				'@media screen': {
					color: 'green'
				}
			})

			expect(nano.putRaw).toHaveBeenCalledTimes(1)
			expect(nano.putRaw.mock.calls[0][0].replace(/[\s\n]+/g, '')).toBe(
				'@mediascreen{.foo{color:green;}}'
			)
		})

		it('supports @media queries - 2', function() {
			const nano = create()
			nano.putRaw = jest.fn()

			nano.put('', {
				'@media screen': {
					'.global': {
						color: 'green'
					}
				}
			})

			expect(nano.putRaw).toHaveBeenCalledTimes(1)
			expect(nano.putRaw.mock.calls[0][0].replace(/[\s\n]+/g, '')).toBe(
				'@mediascreen{.global{color:green;}}'
			)
		})

		it('supports @media queries - 3', function() {
			const nano = create()

			if (env.isClient) {
				nano.putRaw = jest.fn()
			}

			nano.put('.parent', {
				'@media screen': {
					'.foo': {
						color: 'red'
					}
				}
			})

			if (env.isClient) {
				expect(nano.putRaw).toHaveBeenCalledTimes(1)
				expect(nano.putRaw.mock.calls[0][0].replace(/[\s\n]+/g, '')).toBe(
					'@mediascreen{.parent.foo{color:red;}}'
				)
			}

			if (env.isServer) {
				expect(nano.raw.replace(/[\s\n]+/g, '')).toBe(
					'@mediascreen{.parent.foo{color:red;}}'
				)
			}
		})

		it('supports @font-face', function() {
			const nano = create()

			if (env.isClient) {
				nano.putRaw = jest.fn()
			}

			nano.put('@font-face', {
				'font-weight': 'bold'
			})

			if (env.isClient) {
				expect(nano.putRaw).toHaveBeenCalledTimes(1)
				expect(nano.putRaw.mock.calls[0][0].replace(/[\s\n]+/g, '')).toBe(
					'@font-face{font-weight:bold;}'
				)
			}

			if (env.isServer) {
				expect(nano.raw.replace(/[\s\n]+/g, '')).toBe(
					'@font-face{font-weight:bold;}'
				)
			}
		})
	})
})
