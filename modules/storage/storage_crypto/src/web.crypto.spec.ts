import {webcrypto} from "./web.crypto";

describe('webcrypto', () =>{
    it('should be available', () => {
      expect(webcrypto).toBeDefined()
    })
})