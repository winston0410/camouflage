'use strict'
import safeIsObj from 'safe-is-obj'
import { Renderer } from '../type'
import { createCache, isFunction, isProduction} from '../helper'

type Tag = string | Function

const createComponent = (
	Tag: Tag,
	callback: (props: object) => object,
	renderer: Renderer
) => {
	function Component(props) {
		if (!Tag) return null

		const inheritedClassName = props.className || ''

		const generatedClassName = isFunction(callback)
			? renderer.virtual(callback(props))
			: ''

		const extendedClassName = props.css ? ` ${props.css}` : ''

		const assembledClassName = `${inheritedClassName}${generatedClassName}${extendedClassName}`

		return renderer.h(props.as || Tag, {
			...props,
			className: assembledClassName
		})
	}

	return Component
}

const addOn = function(renderer: Renderer): void {
	renderer.jsx = (Tag: Tag, callback: (props: object) => object) => {
		if (!isProduction && !renderer.h) {
			throw new Error(
				'You need to set jsx factory function as renderer.h before using renderer.jsx.'
			)
		}

		if(!isProduction && !renderer.virtual){
			throw new Error('renderer.jsx depends on renderer.virtual but it is now undefined. It seems like that you have forgotten to use virtual() addon')
		}

		return createComponent(Tag, callback, renderer)
	}
}

export default addOn
