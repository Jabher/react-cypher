import { useCypher } from '../src'

describe(`Dummy test`, () => {
  it(`works if true is truthy`, () => {
    expect(true).toBeTruthy()
  })

  it(`DummyClass is instantiable`, () => {
    expect(useCypher``).toBeInstanceOf(Object)
  })
})
