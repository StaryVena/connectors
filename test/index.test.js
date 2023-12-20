const app = require("../src/index");
const request = require("supertest");

// call without parameters
describe("GET /api/v1/connector/rj45.png", () => {
    it("should return an RJ45 connector", async () => {
      const res = await request(app).get("/api/v1/connector/rj45.png");
      expect(res.statusCode).toBe(200);
      expect(res.type).toBe('image/png');
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

// call with image colors
describe("GET /api/v1/connector/rj45.png?l1=000000&l2=ffffff&l3=000000", () => {
    it("should return an RJ45 connector", async () => {
      const res = await request(app).get("/api/v1/connector/rj45.png?l1=000000&l2=ffffff&l3=000000");
      expect(res.statusCode).toBe(200);
      expect(res.type).toBe('image/png');
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

// call with image colors and background
describe("GET /api/v1/connector/rj45.png?l1=000000&l2=ffffff&l3=000000&bg=00ff00", () => {
    it("should return an RJ45 connector", async () => {
      const res = await request(app).get("/api/v1/connector/rj45.png?l1=000000&l2=ffffff&l3=000000&bg=00ff00");
      expect(res.statusCode).toBe(200);
      expect(res.type).toBe('image/png');
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.error).toBe(false);
    });
  });

// call with wrong extension
describe("GET /api/v1/connector/rj45.jpg?l1=000000&l2=ffffff&l3=000000&bg=00ff00", () => {
    it("should return an error - unsuported extesion", async () => {
      const res = await request(app).get("/api/v1/connector/rj45.jpg?l1=000000&l2=ffffff&l3=000000&bg=00ff00");
      expect(res.statusCode).toBe(500);
      expect(res.type).toBe('text/html');
      expect(res.error).toBeDefined();
    });
  });

// call with wrong color
describe("GET /api/v1/connector/rj45.png?l1=XX0000&l2=ffffff&l3=000000&bg=00ff00", () => {
    it("should return an error - unsuported extesion", async () => {
      const res = await request(app).get("/api/v1/connector/rj45.png?l1=XX0000&l2=ffffff&l3=000000&bg=00ff00");
      expect(res.statusCode).toBe(500);
      expect(res.type).toBe('text/html');
      expect(res.error).toBeDefined();
    });
  });

// missing image
describe("GET /api/v1/connector/xx.png?l1=000000&l2=ffffff&l3=000000&bg=00ff00", () => {
    it("should return an error", async () => {
      const res = await request(app).get("/api/v1/connector/xx.png?l1=000000&l2=ffffff&l3=000000&bg=00ff00");
      expect(res.statusCode).toBe(500);
      expect(res.type).toBe('text/html');
      expect(res.error).toBeDefined();
    });
  });


// list of layers
describe("GET /api/v1/connector/rj45.json", () => {
    it("should return a list of layers", async () => {
      const res = await request(app).get("/api/v1/connector/rj45.json");
      expect(res.statusCode).toBe(200);
      expect(res.type).toBe('application/json');
      expect(res.body).toBeDefined();
    });
  });

// list of connectors
describe("GET /api/v1/connectors.json", () => {
    it("should return a list of layers", async () => {
      const res = await request(app).get("/api/v1/connectors.json");
      expect(res.statusCode).toBe(200);
      expect(res.type).toBe('application/json');
      expect(res.body).toBeDefined();
    });
  });

  // call with image colors
describe("GET /api/v1/connector/rj45/l1.png", () => {
    it("should return an RJ45 connector", async () => {
      const res = await request(app).get("/api/v1/connector/rj45/l1.png");
      expect(res.statusCode).toBe(200);
      expect(res.type).toBe('image/png');
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

// not existing page
describe("GET /api/v1/abc/def.json", () => {
    it("should return a list of layers", async () => {
      const res = await request(app).get("/api/v1/abc/def.json");
      expect(res.statusCode).toBe(404);
      expect(res.type).toBe('text/plain');
      expect(res.error).toBeDefined();
    });
  });