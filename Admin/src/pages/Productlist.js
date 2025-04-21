import React, { useEffect, useState } from "react";
import { Table } from "antd";
import { BiEdit } from "react-icons/bi";
import { AiFillDelete } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { deleteAProduct, getProducts, bulkCreateProducts } from "../features/product/productSlice";
import { Link } from "react-router-dom";
import { deleteImg } from "../features/upload/uploadSlice";
import CustomModal from "../components/CustomModal";
import { toast } from "react-toastify";

const columns = [
  {
    title: "SNo",
    dataIndex: "key",
  },
  {
    title: "Title",
    dataIndex: "title",
    sorter: (a, b) => a.title.length - b.title.length,
  },
  {
    title: "Brand",
    dataIndex: "brand",
    sorter: (a, b) => a.brand.length - b.brand.length,
  },
  {
    title: "Category",
    dataIndex: "category",
    sorter: (a, b) => a.category.length - b.category.length,
  },

  {
    title: "Quantity",
    dataIndex: "quantity",
  },
  {
    title: "Price",
    dataIndex: "price",
    sorter: (a, b) => a.price - b.price,
  },
  {
    title: "Action",
    dataIndex: "action",
  },
];

const Productlist = () => {
  const [open, setOpen] = useState(false);
  const [productId, setproductId] = useState("");
  const [importFile, setImportFile] = useState(null);
  const showModal = (e) => {
    setOpen(true);
    setproductId(e);
  };

  const hideModal = () => {
    setOpen(false);
  };
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(getProducts());
  }, []);
  const productState = useSelector((state) => state?.product?.products);
  const data1 = [];
  for (let i = 0; i < productState.length; i++) {
    data1.push({
      key: i + 1,
      title: productState[i].title,
      brand: productState[i].brand,
      category: productState[i].category,
      color: productState[i].color,
      quantity: productState[i].quantity,
      price: `${productState[i].price}`,
      action: (
        <>
          <Link
            to={`/admin/product/${productState[i]._id}`}
            className=" fs-3 text-success"
          >
            <BiEdit />
          </Link>
          <button
            className="ms-3 fs-3 text-danger bg-transparent border-0"
            onClick={() => showModal(productState[i]._id)}
          >
            <AiFillDelete />
          </button>
        </>
      ),
    });
  }
  const deleteProduct = (e) => {
    dispatch(deleteAProduct(e));
    dispatch(deleteImg(e));

    setOpen(false);
    setTimeout(() => {
      dispatch(getProducts());
    }, 100);
  };

  const handleFileChange = (e) => {
    setImportFile(e.target.files[0]);
  };
  
  const handleBulkImport = () => {
    if (!importFile) {
      toast.error("Please select a JSON file");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const products = JSON.parse(e.target.result);
        const result = await dispatch(bulkCreateProducts(products));
        
        if (result.meta.requestStatus === 'fulfilled') {
          toast.success(`Imported ${result.payload.createdCount} products successfully!`);
          setTimeout(() => {
            dispatch(getProducts());
          }, 1000);
        }
      } catch (error) {
        toast.error("Failed to import products: " + error.message);
      }
    };
    reader.readAsText(importFile);
  };

  console.log(data1);
  return (
    <div>
      <h3 className="mb-4 title">Products</h3>
      <div className="d-flex justify-content-between align-items-center gap-3 mb-4">
        <div>
          <input
            type="file"
            className="form-control"
            accept=".json"
            onChange={handleFileChange}
          />
        </div>
        <div>
          <button 
            className="btn btn-success"
            disabled={!importFile}
            onClick={handleBulkImport}
          >
            Bulk Import
          </button>
          <Link to="/admin/product" className="btn btn-primary">
            Add Product
          </Link>
        </div>
      </div>
      <div>
        <Table columns={columns} dataSource={data1} />
      </div>
      <CustomModal
        hideModal={hideModal}
        open={open}
        performAction={() => {
          deleteProduct(productId);
        }}
        title="Are you sure you want to delete this Product?"
      />
    </div>
  );
};

export default Productlist;
