import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import {
  addFriendError, billLine, buildMessage, emptyBill, fmt, parseBill, parseTotal, payerError, split, summary, waUrl,
  MAX_DETAILS, type Bill,
} from './split'

const KEY = 'bill-split-tracker'
const THEME_KEY = 'bill-split-theme'

type Update = (patch: Partial<Bill>) => void

function derive(bill: Bill) {
  const n = bill.friends.length + 1
  const payerErr = payerError(bill.payer, bill.friends.map((f) => f.name))
  const s = bill.total !== null && bill.friends.length ? split(bill.total, n) : null
  const splitErr = s && 'error' in s ? s.error : null
  const ok = s && !('error' in s) && bill.payer.trim() && !payerErr ? s : null
  const message = ok ? buildMessage(bill.total!, n, ok.friendShare, bill.payer, bill.details) : null
  return { n, payerErr, splitErr, ok, message }
}
type Derived = ReturnType<typeof derive>

export default function App() {
  const [bill, setBill] = useState<Bill>(() => {
    let b = emptyBill()
    try {
      b = parseBill(localStorage.getItem(KEY))
    } catch {
      // storage blocked: the save below flags it
    }
    return b.view === 'track' && !derive(b).ok ? { ...b, view: 'setup' } : b
  })
  const [totalText, setTotalText] = useState(() => bill.total?.toString() ?? '')
  const [blocked, setBlocked] = useState(false)
  const [screen, setScreen] = useState(0) // bumped on every screen change; remounts the screen
  const [copied, setCopied] = useState(false) // arrived at Track by copying; never saved
  const [dark, setDark] = useState(() => {
    try {
      const t = localStorage.getItem(THEME_KEY)
      if (t === 'dark' || t === 'light') return t === 'dark'
    } catch {
      // storage blocked: follow the system
    }
    return matchMedia('(prefers-color-scheme: dark)').matches
  })
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(bill))
    } catch {
      setBlocked(true)
    }
  }, [bill])

  const update: Update = (patch) => setBill((b) => ({ ...b, ...patch }))
  const go = (view: Bill['view'], patch: Partial<Bill> = {}, wasCopied = false) => {
    update({ ...patch, view })
    setCopied(wasCopied)
    setScreen((k) => k + 1)
    window.scrollTo(0, 0)
  }

  const d = derive(bill)
  const empty = !bill.payer && !totalText.trim() && !bill.details && !bill.friends.length
  const title = (
    <div className="brand">
      <h1>
        Bill <span>Split</span>
      </h1>
      <p className="tagline">You paid. Get it back.</p>
    </div>
  )

  return (
    <>
      <header>
        {empty ? (
          title
        ) : (
          <ConfirmButton
            before={title}
            label="New bill"
            question="Start a new bill? This clears everything."
            onYes={() => {
              setTotalText('')
              go('setup', emptyBill())
            }}
          />
        )}
        <button
          type="button"
          className="theme"
          aria-label="Dark mode"
          aria-pressed={dark}
          onClick={() => {
            setDark(!dark)
            try {
              localStorage.setItem(THEME_KEY, dark ? 'light' : 'dark')
            } catch {
              // storage blocked: the choice lasts until reload
            }
          }}
        >
          {dark ? '☀' : '☾'}
        </button>
      </header>
      {blocked && <p className="notice">This bill can't be saved in this browser</p>}
      <p className="notice" aria-live="polite">
        {bill.view === 'track' && copied && 'Copied ✓ Now paste it in your WhatsApp group.'}
      </p>
      {bill.view === 'setup' ? (
        <Setup
          key={screen}
          first={screen === 0}
          empty={empty}
          bill={bill}
          d={d}
          update={update}
          totalText={totalText}
          onTotal={(raw) => {
            setTotalText(raw)
            update({ total: parseTotal(raw).value })
          }}
          onTrack={(sentBy) => go('track', { sent: true }, sentBy === 'copy')}
        />
      ) : (
        <Track key={screen} first={screen === 0} bill={bill} d={d} update={update} onEdit={() => go('setup')} />
      )}
    </>
  )
}

/** Inline confirmation that replaces its button in place. Focus goes to Cancel; Esc cancels. */
function ConfirmButton(p: { label: string; question: string; onYes: () => void; before?: ReactNode }) {
  const [open, setOpen] = useState(false)
  const opener = useRef<HTMLButtonElement>(null)
  const cancel = () => {
    flushSync(() => setOpen(false))
    opener.current?.focus()
  }
  if (!open)
    return (
      <>
        {p.before}
        <button type="button" ref={opener} onClick={() => setOpen(true)}>
          {p.label}
        </button>
      </>
    )
  return (
    <div className="confirm" onKeyDown={(e) => e.key === 'Escape' && cancel()}>
      <p role="alert">{p.question}</p>
      <div className="row">
        <button type="button" className="solid" onClick={() => { setOpen(false); p.onYes() }}>
          Yes
        </button>
        <button type="button" autoFocus onClick={cancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}

function Setup(p: {
  first: boolean
  empty: boolean
  bill: Bill
  d: Derived
  update: Update
  totalText: string
  onTotal: (raw: string) => void
  onTrack: (sentBy: 'copy' | 'open' | null) => void
}) {
  const { bill, d, update } = p
  const heading = useRef<HTMLHeadingElement>(null)
  const totalInput = useRef<HTMLInputElement>(null)
  const friendInput = useRef<HTMLInputElement>(null)
  const [friend, setFriend] = useState('')
  const [friendErr, setFriendErr] = useState<string | null>(null)

  useEffect(() => {
    if (p.empty) totalInput.current?.focus()
    else if (!p.first) heading.current?.focus()
  }, []) // on mount only

  const locked = bill.friends.some((f) => f.paid)
  const ticks = bill.friends.filter((f) => f.paid).length
  const totalErr = parseTotal(p.totalText).error ?? d.splitErr
  const share = (n: number | undefined) => (d.ok && n !== undefined ? `${fmt(n)} PKR` : '')

  function addFriend(e: FormEvent) {
    e.preventDefault()
    const err = addFriendError(friend, bill.payer, bill.friends.map((f) => f.name))
    setFriendErr(err)
    if (!err) {
      update({ friends: [...bill.friends, { name: friend.trim(), paid: false }] })
      setFriend('')
    }
    friendInput.current?.focus()
  }

  return (
    <main>
      {bill.sent && d.ok && (
        <button type="button" className="link" onClick={() => p.onTrack(null)}>
          ← Back to payments
        </button>
      )}

      <section>
        <h2 tabIndex={-1} ref={heading}>
          <label htmlFor="total">Bill total</label>
        </h2>
        <div className="money">
          <span>PKR</span>
          <input
            id="total"
            ref={totalInput}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={p.totalText}
            disabled={locked}
            onChange={(e) => p.onTotal(e.target.value)}
            aria-describedby="total-note"
            aria-invalid={!locked && !!totalErr}
          />
        </div>
        {locked ? (
          <>
            <p id="total-note" className="hint">Locked because someone is ticked as paid.</p>
            <ConfirmButton
              label="Change total or people"
              question={`This will clear ${ticks} payment ${ticks === 1 ? 'tick' : 'ticks'}. Continue?`}
              onYes={() => {
                flushSync(() => update({ friends: bill.friends.map((f) => ({ ...f, paid: false })) }))
                totalInput.current?.focus()
              }}
            />
          </>
        ) : (
          <p id="total-note" className={totalErr ? 'error' : 'hint'}>
            {totalErr ?? (!p.totalText.trim() && 'Enter the bill total')}
          </p>
        )}
      </section>

      <section>
        <h2>People</h2>
        <label htmlFor="payer">Your name</label>
        <div className="row">
          <input
            id="payer"
            autoComplete="name"
            value={bill.payer}
            onChange={(e) => update({ payer: e.target.value })}
            aria-describedby="payer-note"
            aria-invalid={!!d.payerErr}
          />
          <span className="amount">{share(d.ok?.payerShare)}</span>
        </div>
        <p id="payer-note" className={d.payerErr ? 'error' : 'hint'}>
          {d.payerErr ?? (!bill.payer.trim() && 'Enter your name')}
        </p>
        <ul className="people">
          {bill.friends.map((f, i) => (
            <li key={f.name} className="row">
              <span className="name">
                {f.name}
                {locked && f.paid && <span className="hint"> paid</span>}
              </span>
              <span className="amount">{share(d.ok?.friendShare)}</span>
              {!locked && (
                <button
                  type="button"
                  className="icon"
                  aria-label={`Remove ${f.name}`}
                  onClick={() => {
                    update({ friends: bill.friends.filter((_, j) => j !== i) })
                    friendInput.current?.focus()
                  }}
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
        {!locked && (
          <form onSubmit={addFriend} noValidate>
            <label htmlFor="friend">Add a friend</label>
            <div className="row">
              <input
                id="friend"
                ref={friendInput}
                autoComplete="off"
                value={friend}
                onChange={(e) => {
                  setFriend(e.target.value)
                  setFriendErr(null)
                }}
                aria-describedby={friendErr ? 'friend-note' : undefined}
                aria-invalid={!!friendErr}
              />
              <button type="submit">Add</button>
            </div>
            {friendErr && <p id="friend-note" className="error">{friendErr}</p>}
          </form>
        )}
      </section>

      <section>
        <label htmlFor="details">
          Where should friends send the money? <span className="hint">(optional)</span>
        </label>
        <textarea
          id="details"
          rows={3}
          maxLength={MAX_DETAILS}
          placeholder="e.g. Meezan · Waseek Ahmed · 0123456789"
          value={bill.details}
          onChange={(e) => update({ details: e.target.value })}
        />
        {bill.details.length >= 180 && <p className="hint">{bill.details.length}/{MAX_DETAILS}</p>}
      </section>

      <section>
        <h2>Message for the group</h2>
        <MessagePanel message={d.message} onSent={p.onTrack} />
      </section>
    </main>
  )
}

function Track(p: { first: boolean; bill: Bill; d: Derived; update: Update; onEdit: () => void }) {
  const { bill, d, update } = p
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (!p.first) heading.current?.focus()
  }, []) // on mount only

  const ok = d.ok! // App never shows Track without a valid split
  const paid = bill.friends.filter((f) => f.paid).length
  const status = summary(d.n, ok.friendShare, paid)

  return (
    <main>
      <div className="row bill-line">
        <h2 tabIndex={-1} ref={heading}>{billLine(bill.total!, d.n)}</h2>
        <button type="button" onClick={p.onEdit}>Edit bill</button>
      </div>
      <p className={paid === bill.friends.length ? 'status done' : 'status'} aria-live="polite">{status}</p>
      <progress className="meter" value={paid + 1} max={d.n} aria-hidden="true" />
      <ul className="checklist">
        <li>
          <label className="row">
            <input type="checkbox" checked disabled aria-label={`${bill.payer.trim()} paid`} />
            <span className="name">
              {bill.payer.trim()}
              <span className="hint">paid (you)</span>
            </span>
            <span className="amount">{fmt(ok.payerShare)} PKR</span>
          </label>
        </li>
        {bill.friends.map((f, i) => (
          <li key={f.name}>
            <label className="row">
              <input
                type="checkbox"
                checked={f.paid}
                aria-label={`${f.name} paid`}
                onChange={(e) =>
                  update({ friends: bill.friends.map((g, j) => (j === i ? { ...g, paid: e.target.checked } : g)) })
                }
              />
              <span className="name">{f.name}</span>
              <span className="amount">{fmt(ok.friendShare)} PKR</span>
            </label>
          </li>
        ))}
      </ul>
      <details>
        <summary>Message for the group</summary>
        <MessagePanel message={d.message} />
      </details>
    </main>
  )
}

/** On Setup, onSent moves to Track. On Track (no onSent) you stay and Copy flashes `Copied ✓`. */
function MessagePanel(p: { message: string | null; onSent?: (by: 'copy' | 'open') => void }) {
  const [failed, setFailed] = useState(false)
  const [flash, setFlash] = useState(false)
  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => setFlash(false), 2000)
    return () => clearTimeout(t)
  }, [flash])

  async function copy() {
    try {
      await navigator.clipboard.writeText(p.message!)
    } catch {
      setFailed(true)
      return
    }
    setFailed(false)
    if (p.onSent) p.onSent('copy')
    else setFlash(true)
  }

  return (
    <>
      <div className="row">
        <button
          type="button"
          className="solid"
          disabled={!p.message}
          onClick={() => {
            window.open(waUrl(p.message!), '_blank', 'noopener')
            p.onSent?.('open')
          }}
        >
          Open in WhatsApp
        </button>
        <button type="button" disabled={!p.message} onClick={copy}>
          {flash ? 'Copied ✓' : 'Copy message'}
        </button>
      </div>
      <p className="error" aria-live="polite">{failed && "Couldn't copy, select the text below"}</p>
      {p.message ? (
        <p className="bubble">{p.message}</p>
      ) : (
        <p className="hint">Add your name, a total and at least one friend to create the message</p>
      )}
    </>
  )
}
