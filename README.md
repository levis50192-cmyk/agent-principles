# Agent Principles

Operating principles written **for the model, not for the human**.

**中文說明在下方。**

---

## The gap

Search for "Claude Code skills" and you get token savers and workflow templates.
Almost nothing tells the model **how not to repeat a class of mistake**.

So every agent learns the same lessons by hitting the same walls — and then the
context gets cleared and the next one hits them again.

This is a short file of principles, each one derived from a failure that actually
happened during real work, each with a check you can actually run.

## The format

Every entry is three lines:

> **Principle** — one imperative sentence
> **The failure it prevents** — something that actually happened
> **The check** — a concrete action, not an attitude

No entry is included unless it came from a real incident. Invented principles
have no weight, and they dilute the file into yet another best-practices list.

## What's in it

| | |
|---|---|
| **Diagnosis** | Catching yourself "trying a different approach" means you skipped diagnosis · Measure before reusing an old constant |
| **Verification** | Verify what the user will see, not what's easy to verify · Silence is not success |
| **Facts & records** | "Not in the file" ≠ "didn't happen" · Record the evidence with the conclusion |
| **Transferring lessons** | A lesson has a scope; state its premise before reapplying it |
| **Execution** | Absolute paths in background commands · Change *every* entry point when changing a default · Map with explicit keys, never by position |
| **Iteration cost** | Batch changes when a retry is expensive · Read a pipeline's input format before reusing it |

Twelve principles. Thirty seconds to scan.

## Install

```bash
git clone https://github.com/levis50192-cmyk/agent-principles
cp -r agent-principles/skills/agent-principles ~/.claude/skills/
```

Then reference it at the start of long sessions, or let the agent load it when
it gets stuck.

## Contributing

Add entries only from incidents you actually hit. Same three-line format.
An entry that can't name the failure it prevents doesn't belong here.

MIT.

---

# 中文

## 為什麼要有這個

網路上的 agent skill 幾乎都在講**省 token** 或**跑流程**。
**沒有人寫「模型該遵守的原則」** —— 結果每個模型都要自己撞一次牆，
上下文一清，下一輪再撞一次同樣的牆。

這是一份短檔案，十二條原則，**每一條都來自真實工作中實際發生的失敗**，
每一條附一個真的能執行的檢查動作。

## 格式

```
原則        一句祈使句
它防的失敗   真的發生過的事
檢查        一個可執行的動作,不是態度
```

**沒有真實案例的條目不收。** 想像出來的原則沒有重量，
而且會把這份文件稀釋成又一個「最佳實踐清單」。

## 幾條例子

- **察覺自己在「換個做法再試一次」，就是漏了診斷**
- **驗使用者會看到的東西，不是你方便驗的東西** —— 檢查中間產物只能證明中間產物是對的
- **「檔案裡沒寫」不等於「事情沒發生」** —— 狀態檔的「空」有兩種意思
- **教訓有適用範圍** —— 說不出前提，代表你記的是結論不是原理
- **靜默不等於成功** —— 過濾條件要能捕捉失敗，不是只捕捉成功

## 安裝

```bash
git clone https://github.com/levis50192-cmyk/agent-principles
cp -r agent-principles/skills/agent-principles ~/.claude/skills/
```

完整內容見 [`skills/agent-principles/SKILL.md`](skills/agent-principles/SKILL.md)。

MIT。
