import React, { useEffect, useState } from "react";
import { Table } from "antd";
import { BiEdit } from "react-icons/bi";
import { AiFillDelete } from "react-icons/ai";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteACoupon,
  getAllCoupon,
  resetState,
} from "../features/coupon/couponSlice";
import CustomModal from "../components/CustomModal";
import { toast } from "react-toastify";

const columns = [
  {
    title: "SNo",
    dataIndex: "key",
  },
  {
    title: "Name",
    dataIndex: "name",
    sorter: (a, b) => a.name.length - b.name.length,
  },
  {
    title: "Discount",
    dataIndex: "discount",
    sorter: (a, b) => a.discount - b.discount,
    render: (text) => `${text}%`,
  },
  {
    title: "Expiry",
    dataIndex: "expiry",
    sorter: (a, b) => new Date(a.expiry) - new Date(b.expiry),
  },
  {
    title: "Action",
    dataIndex: "action",
  },
];

const Couponlist = () => {
  const [open, setOpen] = useState(false);
  const [couponId, setcouponId] = useState("");
  const dispatch = useDispatch();
  const { coupons, isError, isSuccess } = useSelector((state) => state.coupon);

  const showModal = (e) => {
    setOpen(true);
    setcouponId(e);
  };

  const hideModal = () => {
    setOpen(false);
  };

  useEffect(() => {
    dispatch(resetState());
    dispatch(getAllCoupon());
  }, [dispatch]);

  useEffect(() => {
    if (isError) {
      toast.error("Something went wrong!");
    }
    if (isSuccess) {
      toast.success("Coupon deleted successfully!");
    }
  }, [isError, isSuccess]);

  const data1 = coupons.map((coupon, index) => ({
    key: index + 1,
    name: coupon.name,
    discount: coupon.discount,
    expiry: new Date(coupon.expiry).toLocaleDateString(),
    action: (
      <>
        <Link
          to={`/admin/coupon/${coupon._id}`}
          className="fs-3 text-danger"
        >
          <BiEdit />
        </Link>
        <button
          className="ms-3 fs-3 text-danger bg-transparent border-0"
          onClick={() => showModal(coupon._id)}
        >
          <AiFillDelete />
        </button>
      </>
    ),
  }));

  const deleteCoupon = async (e) => {
    try {
      await dispatch(deleteACoupon(e)).unwrap();
      dispatch(getAllCoupon());
      setOpen(false);
    } catch (error) {
      toast.error("Failed to delete coupon");
    }
  };

  return (
    <div>
      <h3 className="mb-4 title">Coupons</h3>
      <div>
        <Table 
          columns={columns} 
          dataSource={data1} 
          loading={!coupons.length}
          pagination={{ pageSize: 10 }}
        />
      </div>
      <CustomModal
        hideModal={hideModal}
        open={open}
        performAction={() => deleteCoupon(couponId)}
        title="Are you sure you want to delete this Coupon?"
      />
    </div>
  );
};

export default Couponlist;
