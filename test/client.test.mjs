/**
 * 不依赖浏览器跑 client.js：用一个假 window 捕获 ModuleLoader 的 factory，
 * 把 React 换成最小实现，然后在 VM 里检查两件事——
 * 1. 两个品牌 slot 都被占住；
 * 2. 峰谷时间表算出来的颜色正确（09:00–12:00、14:00–18:00 为红）。
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const CODE = fs.readFileSync(path.join(ROOT, 'client.js'), 'utf8')

function boot(nowIso) {
  let captured
  const FixedDate = class extends Date {
    constructor(...args) {
      super(...(args.length > 0 ? args : [nowIso]))
    }
    static now() {
      return new Date(nowIso).getTime()
    }
  }
  const React = {
    createElement: (type, props, ...children) => ({ type, props, children }),
    useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
    useEffect: () => {},
  }
  const sandbox = {
    window: { __ModuleLoader__: { load: (module) => { captured = module } } },
    Intl,
    Date: FixedDate,
    setInterval: () => 0,
    clearInterval: () => {},
    document: { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} },
  }
  sandbox.globalThis = sandbox
  vm.createContext(sandbox)
  vm.runInContext(CODE, sandbox)

  const module = captured.factory((name) => {
    if (name === 'react') return React
    throw new Error(`unexpected require: ${name}`)
  })
  const registrations = []
  module.apply({
    slots: {
      inject: (_slot, callback) => {
        registrations.push(callback())
        return () => {}
      },
      register: (options, component) => ({ options, component }),
    },
  })
  return registrations
}

const colorAt = (iso) => boot(iso)[0].component({ size: 24 }).props.style.color

test('occupies the sidebar and hero brand marks', () => {
  const registrations = boot('2026-11-02T12:00:00+08:00')
  assert.deepEqual(
    registrations.map((entry) => entry.options.name),
    ['sidebar.brand.mark', 'conversation.hero.brand.mark'],
  )
})

test('peak hours are red, off-peak hours are blue', () => {
  assert.equal(colorAt('2026-11-02T08:59:00+08:00'), '#4D6BFE')
  assert.equal(colorAt('2026-11-02T09:00:00+08:00'), '#E5484D')
  assert.equal(colorAt('2026-11-02T11:59:00+08:00'), '#E5484D')
  assert.equal(colorAt('2026-11-02T12:00:00+08:00'), '#4D6BFE')
  assert.equal(colorAt('2026-11-02T13:59:00+08:00'), '#4D6BFE')
  assert.equal(colorAt('2026-11-02T14:00:00+08:00'), '#E5484D')
  assert.equal(colorAt('2026-11-02T17:59:00+08:00'), '#E5484D')
  assert.equal(colorAt('2026-11-02T18:00:00+08:00'), '#4D6BFE')
  assert.equal(colorAt('2026-11-02T23:30:00+08:00'), '#4D6BFE')
})

test('ignores the browser timezone', () => {
  // 同一时刻，用 UTC 书写也应该得到北京时间 10:00 的结论（峰时）。
  assert.equal(colorAt('2026-11-02T02:00:00Z'), '#E5484D')
})
