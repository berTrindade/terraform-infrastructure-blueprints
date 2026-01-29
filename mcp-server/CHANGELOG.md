## [1.1.0](https://github.com/berTrindade/terraform-infrastructure-blueprints/compare/v1.0.0...v1.1.0) (2026-01-29)

### Features

* trigger release workflow test ([2d53797](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/2d5379744e0a43ccdf3f851fc77dfae2f85472e2))

### Bug Fixes

* configure semantic-release to use mcp-v tag prefix and fix Docker tag casing ([99464a8](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/99464a87d3dff172f62fff9b33cfebaa7014e075))
* disable npm publish to allow GitHub releases to be created ([e6a48fe](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/e6a48feff733d06b4dceb688d95c42769ebe971f))
* use lowercase repository owner in Docker tags ([17bfdaa](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/17bfdaa60cc2dac4070498097ac6e2c568d8fb7e))

## [1.2.1](https://github.com/berTrindade/terraform-infrastructure-blueprints/compare/mcp-v1.2.0...mcp-v1.2.1) (2026-01-29)

### Bug Fixes

* disable npm publish to allow GitHub releases to be created ([e6a48fe](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/e6a48feff733d06b4dceb688d95c42769ebe971f))

## [1.2.0](https://github.com/berTrindade/terraform-infrastructure-blueprints/compare/mcp-v1.1.0...mcp-v1.2.0) (2026-01-29)

### Features

* trigger release workflow test ([2d53797](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/2d5379744e0a43ccdf3f851fc77dfae2f85472e2))

## [1.1.0](https://github.com/berTrindade/terraform-infrastructure-blueprints/compare/mcp-v1.0.2...mcp-v1.1.0) (2026-01-29)

### Features

* add onboarding and testing commands for new developers ([c0dc2d6](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/c0dc2d62e88af08c266c9cb56aae253b0f7c6af3))
* add Terraform CI/CD workflows for HCP and S3 backends ([d5a81f3](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/d5a81f330438b3323d1e303bda289b62e0779969))
* add VPC Flow Logs and CloudWatch Container Insights support ([1fc2d53](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/1fc2d5365386822706c331edba6c6306075a68c7))
* add VPC Flow Logs and CloudWatch Log Group resources ([76a092a](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/76a092abd94c5bfa62d73b6673ee5fd4171a5694))
* enhance AI assistant guidelines and MCP server tools ([145d4ae](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/145d4aea4975180c459c5d0bb9d226ddd29099c8))
* enhance blueprint resource registration and error handling ([11ff774](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/11ff774def7157f66931973976f8b10a9be46ca7))
* implement comprehensive blueprint management and tooling ([abaad26](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/abaad26f625ad3c5f068f642571cf2a04e7efec6))
* implement module file registration for blueprints ([0f6cfa1](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/0f6cfa11616c4955b43ff3bf3541f8d4f785d9ea))
* introduce Azure Functions + PostgreSQL blueprint ([dd7921b](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/dd7921b71fe148c69016f0f3b5cae23edda913c4))
* **mcp-server:** improve AI assistant usability ([33ba5dd](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/33ba5dd52b3af79d16a3d4129facefa0920a1c1b))
* migrate to Gateway API for ArgoCD and sample applications ([a5c6f0e](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/a5c6f0e03a92dadc089fdf0b1bb0bd7d26c817a2))
* test release flow ([7cd4386](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/7cd4386b2cca28452ae56230cb9ed376a79a5a79))
* update Docker configurations and add .dockerignore files ([30aedd0](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/30aedd02ebceaf3b6ca24e6e4897b418adfa5de1))
* use semantic versioning tags instead of mcp-v* prefix ([be07396](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/be0739667c76aa41e01d344e019b25f4d6118a32))

### Bug Fixes

* add missing conventional-changelog-conventionalcommits dependency ([b9edd15](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/b9edd15d9c1602176f19059b34e32ba65c00e1a3))
* **ci:** update dockerfile parameter to file for build-push-action@v6 ([0aed94b](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/0aed94bc05e581728cae307458301e832317fe41))
* configure semantic-release to use mcp-v tag prefix and fix Docker tag casing ([99464a8](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/99464a87d3dff172f62fff9b33cfebaa7014e075))
* correct workflow YAML syntax - move tags to top level ([186e4bc](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/186e4bc31a66dcb3dcf3cc00c0d530588ff39239))
* **mcp-server:** resolve TypeScript type declarations for SDK imports ([bb81ddf](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/bb81ddf3b2112b72e7504700cfbaa481837415c3))
* nest tags under push in workflow trigger ([39f9cf1](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/39f9cf1e48ffa78825a24e9aa26fa0fd8dbaf3e9))
* remove mcp-server source exclusions from mcp-server/.dockerignore ([6bb2410](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/6bb2410d742d6ee52c26fd1ef541f8dfd5489186))
* resolve test failures in validation, errors, and logger tests ([a1d1148](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/a1d11483fdbc0a9a7fc69ab64d9cc442adc1a5be))
* update Node.js version to 22 for semantic-release compatibility ([c6c0ee1](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/c6c0ee11ac6b6a7feef0185c9008f6aa9ca81214))
* update vitest configuration and enhance logging for server operations ([c5f4177](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/c5f417719a94f141e0293349d4f1e881786c2b1a))
* use lowercase repository owner in Docker tags ([17bfdaa](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/17bfdaa60cc2dac4070498097ac6e2c568d8fb7e))

## 1.0.0 (2026-01-29)

### Features

* add .gitignore, LICENSE, and update CONTRIBUTING and README files ([514fb6f](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/514fb6f458a8c37a921fe07ed9b2e60d0e4d1134))
* add AI Assistant documentation and quick reference materials ([dbdd952](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/dbdd9523e26b4272365d3082238a1610db8e81da))
* add architectural comparison data for decision-making ([53d3b19](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/53d3b19b592c3a64dcea328f2ccc45bd4f948895))
* add BLUEPRINTS and EXTRACTION_PATTERNS imports to server tests ([8c56371](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/8c56371fc50774851a3459b020ae99e8dcb5ba9b))
* add comprehensive documentation and test scenarios for MCP server capabilities ([4c9eed7](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/4c9eed7468dbd7d3f7bdc2b4245e9a6a1946d140))
* add GitHub repository configuration ([84f4ef8](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/84f4ef886caa51e6a53ee7f521728a5748d28efe))
* add maintainer blueprint validation system ([86297cf](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/86297cf4ba2534dd561ee493a436a78b33b0d39f))
* add multi-environment support with approval workflow ([f63fb66](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/f63fb66381dbb92dd6a3b05ecc05815b37b1aad7))
* add onboarding and testing commands for new developers ([c0dc2d6](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/c0dc2d62e88af08c266c9cb56aae253b0f7c6af3))
* add self-contained environment tools to each blueprint ([f989c41](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/f989c416e079368be798d0bed11072e6844944a7))
* add Terraform CI/CD workflows for HCP and S3 backends ([d5a81f3](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/d5a81f330438b3323d1e303bda289b62e0779969))
* add terraform infrastructure blueprints for AWS ([762d427](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/762d4272e7f0dbc7269a606a85a8c8d71bcbe76c))
* add VPC Flow Logs and CloudWatch Container Insights support ([1fc2d53](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/1fc2d5365386822706c331edba6c6306075a68c7))
* add VPC Flow Logs and CloudWatch Log Group resources ([76a092a](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/76a092abd94c5bfa62d73b6673ee5fd4171a5694))
* adopt samsung-maestro patterns and terraform-skill best practices ([7ab0be9](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/7ab0be9989917b9341079af647052334621285bf))
* configure AWS OIDC authentication for GitHub Actions ([9bde656](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/9bde656a51baccf28f92b7331d499007922e9e6e))
* enhance AI assistant guidelines and MCP server tools ([145d4ae](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/145d4aea4975180c459c5d0bb9d226ddd29099c8))
* enhance blueprint resource registration and error handling ([11ff774](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/11ff774def7157f66931973976f8b10a9be46ca7))
* enhance documentation with new guides for deployment, environments, and CI/CD ([8abddd3](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/8abddd36d97242d42cba29ed5721222f89f974f2))
* implement comprehensive blueprint management and tooling ([abaad26](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/abaad26f625ad3c5f068f642571cf2a04e7efec6))
* implement module file registration for blueprints ([0f6cfa1](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/0f6cfa11616c4955b43ff3bf3541f8d4f785d9ea))
* introduce Azure Functions + PostgreSQL blueprint ([dd7921b](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/dd7921b71fe148c69016f0f3b5cae23edda913c4))
* introduce new blueprints for AWS AppSync with Lambda and Aurora Serverless ([7055384](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/70553849340d635d86e358aea24556d20ff61c04))
* **mcp-server:** improve AI assistant usability ([33ba5dd](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/33ba5dd52b3af79d16a3d4129facefa0920a1c1b))
* **mcp:** add Docker distribution via ghcr.io ([bdfe167](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/bdfe1677917afccda51c3565d9eff10f6d197283))
* migrate to Gateway API for ArgoCD and sample applications ([a5c6f0e](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/a5c6f0e03a92dadc089fdf0b1bb0bd7d26c817a2))
* refactor AGENTS.md for progressive disclosure and enhance documentation structure ([6e381a0](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/6e381a05cfc7ad2a124ac730837c474264503ff2))
* **serverless-api-dynamodb:** add declarative route configuration ([2d2dbb3](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/2d2dbb3d5188223ab3215e2273f23ef9f8fcb290))
* **serverless:** migrate 5 API examples to official modules with declarative routes ([534a3e2](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/534a3e2e5a112daccf1b03f379143763468c8b58))
* test release flow ([7cd4386](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/7cd4386b2cca28452ae56230cb9ed376a79a5a79))
* update Docker configurations and add .dockerignore files ([30aedd0](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/30aedd02ebceaf3b6ca24e6e4897b418adfa5de1))
* use semantic versioning tags instead of mcp-v* prefix ([be07396](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/be0739667c76aa41e01d344e019b25f4d6118a32))

### Bug Fixes

* add missing conventional-changelog-conventionalcommits dependency ([b9edd15](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/b9edd15d9c1602176f19059b34e32ba65c00e1a3))
* add package.json with ES module type for worker Lambda ([93d8f3d](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/93d8f3de21df95c78592c6560dfc34c6604e2497))
* **ci:** update dockerfile parameter to file for build-push-action@v6 ([0aed94b](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/0aed94bc05e581728cae307458301e832317fe41))
* correct workflow YAML syntax - move tags to top level ([186e4bc](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/186e4bc31a66dcb3dcf3cc00c0d530588ff39239))
* **mcp-server:** resolve TypeScript type declarations for SDK imports ([bb81ddf](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/bb81ddf3b2112b72e7504700cfbaa481837415c3))
* **mcp:** lowercase Docker image name for ghcr.io ([e18c7ab](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/e18c7ab57b09f15694c256afe655a2fc49d3dbe4))
* **mcp:** use dynamic repo owner for image name ([fdcdeea](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/fdcdeea16d4510c4684ddf150d2c020060ee0501))
* nest tags under push in workflow trigger ([39f9cf1](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/39f9cf1e48ffa78825a24e9aa26fa0fd8dbaf3e9))
* remove COMPARISONS and compare_blueprints tool ([5af63b4](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/5af63b42c53aad6a2deabc897e3a3d1f086e1f22))
* remove COMPARISONS and scenario 3-5 tests from test file ([160e067](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/160e06780883135322c1a4ffc178d064132411e4))
* remove invalid secrets condition in workflow ([589b514](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/589b51462e469f27ba96e1f7293d07fbaffe415b))
* remove mcp-server source exclusions from mcp-server/.dockerignore ([6bb2410](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/6bb2410d742d6ee52c26fd1ef541f8dfd5489186))
* resolve test failures in validation, errors, and logger tests ([a1d1148](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/a1d11483fdbc0a9a7fc69ab64d9cc442adc1a5be))
* terraform format and improve validation script ([d65e8c7](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/d65e8c7abc7bdf30530278fcde2b4c1ae3767052))
* update all repo references from ustwo org to berTrindade ([c740db1](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/c740db16cbfbd45428f71ebb4fba75f7143578b9))
* update Node.js version to 22 for semantic-release compatibility ([c6c0ee1](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/c6c0ee11ac6b6a7feef0185c9008f6aa9ca81214))
* update vitest configuration and enhance logging for server operations ([c5f4177](https://github.com/berTrindade/terraform-infrastructure-blueprints/commit/c5f417719a94f141e0293349d4f1e881786c2b1a))
