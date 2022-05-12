import express, { RequestHandler } from "express";
import { memoryUsage } from "process";
import multer from "multer";

const round = (n: number) => Math.round(n * 100) / 100;

const parseNum = (n: unknown, defaultValue: number) => {
  const parsed = parseInt(String(n));

  if (Number.isNaN(parsed) || parsed < 0) {
    return defaultValue;
  }

  return parsed;
};

const getMemory: RequestHandler = (req, res) => {
  const memory = Object.entries(memoryUsage()).reduce(
    (obj, [key, value]) => ({ ...obj, [key]: round(value / (1024 * 1024)) }),
    {}
  );

  res.json(memory);
};

const allocate: RequestHandler = (req, res) => {
  const mb = parseNum(req.query.mb, 32);
  const keep = parseNum(req.query.keep, 10);

  (async () => {
    const buf = Buffer.allocUnsafe(mb * 1024 * 1024);

    buf.reverse();

    await new Promise((r) => setTimeout(r, keep * 1000));
  })();

  res.send(
    `allocated ${mb}MB of memory, will be garbage collected in ${keep}s`
  );
};

const computeFibo: RequestHandler = (req, res) => {
  const fibo = (n: number): number => {
    if (n <= 1) {
      return n;
    }

    return fibo(n - 1) + fibo(n - 2);
  };

  const n = parseNum(req.query.n, 9);

  res.send(`fibo(${n}) = ${fibo(n)}`);
};

const computeSqrt2: RequestHandler = (req, res) => {
  const sqrt = (n: number) => {
    let x = n;
    let y = 1;

    while (x > y) {
      x = (x + y) / 2;
      y = n / x;
    }

    return x;
  };

  const n = parseNum(req.query.n, 1000 * 1000 * 1000);

  for (let i = 0; i < n; ++i) {
    sqrt(2);
  }

  res.send(`computed sqrt(2) ${n} times`);
};

const returnStatus: RequestHandler = (req, res) => {
  const status = parseNum(req.query.status, 200);

  res.status(status).send(`response sent with status ${status}`);
};

const wait: RequestHandler = async (req, res) => {
  const time = parseNum(req.query.time, 1000);

  await new Promise((r) => setTimeout(r, time));

  res.send(`waited for ${time}ms before sending the response`);
};

const receiveData: RequestHandler[] = [
  multer().single("file"),
  (req, res) => {
    if (!req.file) {
      return res.end();
    }

    res.send(`received ${round(req.file.size / (1024 * 1024))}MB of data`);
  },
];

const generateData: RequestHandler = (req, res) => {
  const mb = parseNum(req.query.mb, 32);
  const buf = Buffer.allocUnsafe(mb * 1024 * 1024);

  res.send(buf);
};

const { HOST = "0.0.0.0", PORT = "8080" } = process.env;

const main = () => {
  const app = express();

  app.use((_req, res, next) => {
    const send = res.send.bind(res);

    res.send = (data: string | Buffer) => {
      if (Buffer.isBuffer(data)) {
        console.log(`sending ${data.length / (1024 * 1024)}MB of data`);
      } else {
        console.log(data);
      }

      return send(data);
    };

    next();
  });

  app.use("/memory", getMemory);
  app.use("/allocate", allocate);
  app.use("/sqrt2", computeSqrt2);
  app.use("/fibo", computeFibo);
  app.use("/status", returnStatus);
  app.use("/wait", wait);
  app.use("/send", receiveData);
  app.use("/generate", generateData);

  app.listen(parseInt(PORT), HOST);
  console.info(`app listening on ${HOST}:${PORT}`);
};

main();
