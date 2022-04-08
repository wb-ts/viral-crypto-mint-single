const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
var ethers = require("ethers");
const infos = require("./infos.json");
const leaves = [];
for (let i = 0; i < Object.keys(infos).length; i++) {
  leaves.push(
    ethers.utils.solidityKeccak256(
      ["uint256", "address", "uint256"],
      [
        infos[Object.keys(infos)[i]]["vested"],
        Object.keys(infos)[i],
        infos[Object.keys(infos)[i]]["pure"],
      ]
    )
  );
}

const tree = new MerkleTree(leaves, keccak256, { sort: true });

export const getProof = async (address, user) => {
  const pure = user.pure.toString();
  const vest = user.vested.toString();
  const leaf = ethers.utils.solidityKeccak256(
    ["uint256", "address", "uint256"],
    [vest, address.toLowerCase(), pure]
  );
  let proof = tree.getHexProof(leaf);
  if (proof.length > 0) {
    return proof;
  } else {
    return ["0x0000000000000000000000000000000000000000000000000000000000000000"];
  }
}

export const getInfo = async (address) => {
  console.log("address",address.toLowerCase());
  const info = infos[address.toLowerCase()];
  const toSend = {};
  toSend["pure"] = "0";
  toSend["vested"] = "0";
  if (info) {
    toSend["pure"] = info["pure"];
    toSend["vested"] = info["vested"];
  }
  return toSend;
}

export const getRoot = () => {
    let root = tree.getHexRoot();
    return root;
}