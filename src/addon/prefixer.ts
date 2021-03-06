import { prefix as addPrefix } from 'inline-style-prefixer'
import { Renderer } from '../type'

const defaultConfig = {
  selectorToPrefix: {
    '::placeholder': [
      '::-webkit-input-placeholder',
      '::-moz-placeholder',
      ':-ms-input-placeholder'
    ]
  }
}

const addOn = function(renderer: Renderer, config = defaultConfig): void {
  const { selectorToPrefix } = config
  renderer.selectorToPrefix = selectorToPrefix

  if (renderer.keyframes) {
    const keyframes = renderer.keyframes
    renderer.keyframes = (decls, name) => keyframes(addPrefix(decls), name)
  }

  if (renderer.virtual) {
    renderer.prefixer = addPrefix
  }

  if(renderer.global){
    const globalFn = renderer.global
    renderer.global = (decls, selectors) => globalFn(addPrefix(decls), selectors)
  }
}

export default addOn
