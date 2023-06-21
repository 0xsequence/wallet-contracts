
import { spawn, Worker, Pool } from "threads"
import { BenchWorker } from "./workers/bench-worker"

import { task } from "hardhat/config"
import { boolean, int } from "hardhat/internal/core/params/argumentTypes"
import fs from "fs"

class BufferSort {
  buffer: { i: number, val: string }[] = []
  next: number = 0

  constructor(private onValue: (val: string) => void) {}

  feed = (i: number, val: string) => {
    this.buffer.push({ i, val })
    this.buffer = this.buffer.sort((a, b) => a.i - b.i)

    while (this.buffer.length > 0 && this.buffer[0].i === this.next) {
      this.onValue(this.buffer[0].val)
      this.buffer.shift()
      this.next++
    }
  }
}

async function main(args: {
  csv: string,
  topology: string,
  notrim: boolean,
  runs: number,
  minsign: number,
  maxsign: number,
  minidle: number,
  maxidle: number,
  cpus: number
}) {
  let { csv, topology, notrim, runs, minsign, maxsign, minidle, maxidle, cpus } = args

  const disableTrim = notrim == true
  console.log(`Doing benchmark with params:`)
  console.log(`  csv: ${csv}`)
  console.log(`  topology: ${topology}`)
  console.log(`  disableTrim: ${disableTrim}`)
  console.log(`  runs: ${runs}`)
  console.log(`  minSign: ${minsign}`)
  console.log(`  maxSign: ${maxsign}`)
  console.log(`  minIdle: ${minidle}`)
  console.log(`  maxIdle: ${maxidle}`)
  console.log(`  cpus: ${cpus}`)

  if (minidle > maxidle) throw new Error("minIdle must be <= maxIdle")
  if (minsign > maxsign) throw new Error("minSign must be <= maxSign")

  const pool = Pool(() => spawn<BenchWorker>(new Worker("./workers/bench-worker")), { size: cpus })

  const file = fs.createWriteStream(csv, { flags: "a" })
  const fileSorter = new BufferSort((val: string) => file.write(val))
  const consoleSorter = new BufferSort((val: string) => console.log(val))

  // Create CSV writter
  let batched = 0
  file.write("topology,disableTrim,signing,idle,runs,min,max,avg,cmin,cmax,cavg\n")
  for (let i = minsign; i < maxsign; i++) {
    for (let j = minidle; j < maxidle - 1; j++) {
      const absi = ((i - minsign) * maxidle) + j

      if (batched > cpus * 250) {
        await pool.settled()
        batched = 0
      }
      batched++

      pool.queue(async worker => {
        await worker.setup(i, j, runs, topology as any, disableTrim)
        const r = await worker.run()

        fileSorter.feed(absi, `${topology},${disableTrim},${r.signing},${r.idle},${runs},${r.min},${r.max},${r.avg},${r.data.min},${r.data.max},${r.data.avg}\n`)
        consoleSorter.feed(absi, `${absi}: ${topology} (notrim ${disableTrim}): ${r.signing}/${r.signing + r.idle} (${runs}): min: ${r.min} max: ${r.max} avg: ${r.avg} cmin: ${r.data.min} cmax: ${r.data.max} cavg: ${r.data.avg}`)
      })
    }
  }

  await pool.completed()
  await pool.terminate()
  file.close()
}

task("benchmark", "Runs sequence benchmarks")
  .addParam("csv", "The CSV file to write to", `benchmark-${Math.floor(Date.now())}.csv`)
  .addParam("topology", "The wallet topology to use", "legacy")
  .addParam("runs", "The number of runs to perform", 10, int)
  .addParam("minsign", "The start of the range of signature members who are going to sign", 1, int)
  .addParam("maxsign", "The end of the range of signature members who are going to sign", 255, int)
  .addParam("minidle", "The start of the range of idle members on the config", 0, int)
  .addParam("maxidle", "The end of the range of idle members on the config", 255, int)
  .addParam("cpus", "The number of CPUs to use", 1, int)
  .addParam("notrim", "Disable trimming of redudant signature parts", false, boolean)
  .setAction(async (args) => {
    return main(args)
  })
